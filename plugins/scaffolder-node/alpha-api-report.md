## API Report File for "@backstage/plugin-scaffolder-node"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
import { ExtensionPoint } from '@backstage/backend-plugin-api';
import { TaskBroker } from '@backstage/plugin-scaffolder-node';
import { TemplateAction } from '@backstage/plugin-scaffolder-node';
import { TemplateFilter } from '@backstage/plugin-scaffolder-node';
import { TemplateGlobal } from '@backstage/plugin-scaffolder-node';

// @alpha
export interface ScaffolderActionsExtensionPoint {
  // (undocumented)
  addActions(...actions: TemplateAction<any, any>[]): void;
}

// @alpha
export const scaffolderActionsExtensionPoint: ExtensionPoint<ScaffolderActionsExtensionPoint>;

// @alpha
export interface ScaffolderTaskBrokerExtensionPoint {
  // (undocumented)
  setTaskBroker(taskBroker: TaskBroker): void;
}

// @alpha
export const scaffolderTaskBrokerExtensionPoint: ExtensionPoint<ScaffolderTaskBrokerExtensionPoint>;

// @alpha
export interface ScaffolderTemplatingExtensionPoint {
  // (undocumented)
  addTemplateFilters(filters: Record<string, TemplateFilter>): void;
  // (undocumented)
  addTemplateGlobals(filters: Record<string, TemplateGlobal>): void;
}

// @alpha
export const scaffolderTemplatingExtensionPoint: ExtensionPoint<ScaffolderTemplatingExtensionPoint>;

// (No @packageDocumentation comment for this package)
```