/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ContainerRunner } from '@backstage/backend-common';
import fs from 'fs-extra';
import path from 'path';
import * as yaml from 'yaml';
import { TemplaterBase, TemplaterRunOptions } from '../types';

// TODO(blam): Replace with the universal import from github-actions after a release
// As it will break the E2E without it
const GITHUB_ACTIONS_ANNOTATION = 'github.com/project-slug';

export class CreateReactAppTemplater implements TemplaterBase {
  private readonly containerRunner: ContainerRunner;

  constructor({ containerRunner }: { containerRunner: ContainerRunner }) {
    this.containerRunner = containerRunner;
  }

  public async run({
    workspacePath,
    values,
    logStream,
  }: TemplaterRunOptions): Promise<void> {
    const {
      component_id: componentName,
      use_typescript: withTypescript,
      use_github_actions: withGithubActions,
      description,
      owner,
    } = values;
    const intermediateDir = path.join(workspacePath, 'template');
    await fs.ensureDir(intermediateDir);

    const mountDirs = {
      [intermediateDir]: '/template',
      [intermediateDir]: '/result',
    };

    await this.containerRunner.runContainer({
      imageName: 'node:lts-alpine',
      command: ['npx'],
      args: [
        'create-react-app',
        componentName as string,
        withTypescript ? ' --template typescript' : '',
      ],
      mountDirs,
      workingDir: '/result',
      logStream: logStream,
      // Set the home directory inside the container as something that applications can
      // write to, otherwise they will just fail trying to write to /
      envVars: { HOME: '/tmp' },
    });

    // if cookiecutter was successful, intermediateDir will contain
    // exactly one directory.
    const [generated] = await fs.readdir(intermediateDir);

    if (generated === undefined) {
      throw new Error('No data generated by cookiecutter');
    }

    const resultDir = path.join(workspacePath, 'result');
    await fs.move(path.join(intermediateDir, generated), resultDir);

    const extraAnnotations: Record<string, string> = {};
    if (withGithubActions) {
      await fs.mkdir(`${resultDir}/.github`);
      await fs.mkdir(`${resultDir}/.github/workflows`);
      const githubActionsYaml = `
name: CRA Build

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [12.x]

    steps:
    - name: checkout code
      uses: actions/checkout@v1
    - name: get yarn cache
      id: yarn-cache
      run: echo "::set-output name=dir::$(yarn cache dir)"
    - uses: actions/cache@v2
      with:
        path: \${{ steps.yarn-cache.outputs.dir }}
        key: \${{ runner.os }}-yarn-\${{ hashFiles('**/yarn.lock') }}
        restore-keys: |
          \${{ runner.os }}-yarn-
    - name: use node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: \${{ matrix.node-version }}
    - name: yarn install, build, and test
      working-directory: .
      run: |
        yarn install
        yarn build
        yarn test
      env:
        CI: true
      `;
      await fs.writeFile(
        `${resultDir}/.github/workflows/main.yml`,
        githubActionsYaml,
      );

      extraAnnotations[
        GITHUB_ACTIONS_ANNOTATION
      ] = `${values?.destination?.git?.owner}/${values?.destination?.git?.name}`;
    }

    const componentInfo = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: componentName,
        description,
        annotations: {
          ...extraAnnotations,
        },
      },
      spec: {
        type: 'website',
        lifecycle: 'experimental',
        owner,
      },
    };

    await fs.writeFile(
      `${resultDir}/catalog-info.yaml`,
      yaml.stringify(componentInfo),
    );
  }
}
