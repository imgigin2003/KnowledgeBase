export function createPageUrl(pageNameAndParams) {
  const [page, params] = pageNameAndParams.split("?");
  let url = `/${page.toLowerCase()}`;
  if (params) {
    url += `?${params}`;
  }
  return url;
}
