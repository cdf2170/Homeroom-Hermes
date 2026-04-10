export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AdapterError";
  }
}

export class AdapterUnavailableError extends AdapterError {
  constructor(message = "Adapter is not available") {
    super(message, "ADAPTER_UNAVAILABLE");
    this.name = "AdapterUnavailableError";
  }
}

export class AdapterNotFoundError extends AdapterError {
  constructor(resource: string) {
    super(`Not found: ${resource}`, "ADAPTER_NOT_FOUND");
    this.name = "AdapterNotFoundError";
  }
}
