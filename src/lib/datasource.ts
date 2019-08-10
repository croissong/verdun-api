import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
import { pluck } from 'ramda';

export class PrometheusAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL =
      process.env.NODE_ENV === 'production'
        ? 'http://prometheus-prometheus-oper-prometheus.prometheus.svc:9090/api/v1'
        : 'https://prometheus.patrician.gold/api/v1';
  }

  willSendRequest(request: RequestOptions) {
    request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
  }

  async getContainerInfo(pod: string) {
    const query = `kube_pod_container_info{pod="${pod}"}`;
    const res = await this.runQuery(query);
    const metric = pluck('metric', res.data.result);
    return metric;
  }

  async getInitContainers(pod: string) {
    const query = `kube_pod_init_container_info{pod="${pod}"}`;
    const res = await this.runQuery(query);
    const metric = pluck('metric', res.data.result);
    return metric || [];
  }

  async getPodInfo(labels: Label[] = [], namespaces?: string[]) {
    let fields = [];
    labels.forEach(({ key, value }) => fields.push(`label_${key}="${value}"`));
    if (namespaces) {
      const namespaceSelector = namespaces.join('|');
      fields.push(`namespace=~"(${namespaceSelector})"`);
    }
    let query = `kube_pod_labels{${fields.join(';')}}`;
    const res = await this.runQuery(query);
    let metric = pluck('metric', res.data.result);
    return metric;
  }

  async getPodReadiness(pod: string) {
    const query = `kube_pod_status_ready{pod="${pod}", condition="true"}`;
    const res = await this.runQuery(query);
    const value = res.data.result[0].value[1];
    return { value };
  }

  private async runQuery(query: string) {
    query = encodeURIComponent(query);
    return this.get(`query?query=${query}`);
  }
}

type Label = {
  key: string;
  value: string;
};
