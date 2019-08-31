import { BaseError } from "../../utils";

export class EzFormUnexpectedError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}
