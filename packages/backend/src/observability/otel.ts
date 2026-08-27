import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface OtelConfig {
  enabled: boolean;
  serviceName: string;
  endpoint: string;
}

export interface OtelSdk {
  start(): Promise<void>;
  shutdown(): Promise<void>;
}

type Deps = {
  NodeSdkCtor?: typeof NodeSDK;
  exporterFactory?: (endpoint: string) => InstanceType<typeof OTLPTraceExporter>;
  resourceFactory?: typeof resourceFromAttributes;
};

export function createOtelSdk(config: OtelConfig, deps: Deps = {}): OtelSdk | null {
  if (!config.enabled) return null;

  const NodeSdkCtor = deps.NodeSdkCtor ?? NodeSDK;
  const exporterFactory =
    deps.exporterFactory ??
    ((endpoint: string) => new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }));
  const resourceFactory = deps.resourceFactory ?? resourceFromAttributes;

  const exporter = exporterFactory(config.endpoint);
  const sdk = new NodeSdkCtor({
    resource: resourceFactory({ [ATTR_SERVICE_NAME]: config.serviceName }),
    traceExporter: exporter as never,
  });

  return {
    async start() {
      await sdk.start();
    },
    async shutdown() {
      await sdk.shutdown();
    },
  };
}
