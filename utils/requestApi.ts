import axiosClient from "@/libs/axiosClient";

interface RequestApiOptions {
  [key: string]: any;
}

const requestApi = {
  get: <TResponse>(
    url: string,
    params?: object,
    config: RequestApiOptions = {},
  ) =>
    axiosClient
      .get<TResponse>(url, { params, ...config })
      .then((res) => Promise.resolve(res.data)),
  post: <TResponse>(url: string, data: any, config: RequestApiOptions = {}) =>
    axiosClient
      .post<TResponse>(url, data, config)
      .then((res) => Promise.resolve(res.data)),
  put: <TResponse>(url: string, data: any, config: RequestApiOptions = {}) =>
    axiosClient
      .put<TResponse>(url, data, config)
      .then((res) => Promise.resolve(res.data)),
  delete: <TResponse>(
    url: string,
    params?: any,
    config: RequestApiOptions = {},
  ) =>
    axiosClient
      .delete<TResponse>(url, { params, ...config })
      .then((res) => Promise.resolve(res.data)),
};

export default requestApi;
