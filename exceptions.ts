export class LBCError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LBCError";
  }
}

export class InvalidValue extends LBCError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidValue";
  }
}

export class RequestError extends LBCError {
  constructor(message: string) {
    super(message);
    this.name = "RequestError";
  }
}

export class DatadomeError extends RequestError {
  constructor(message: string) {
    super(message);
    this.name = "DatadomeError";
  }
}

export class NotFoundError extends LBCError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
