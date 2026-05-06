export class EnterpriseSecurity {
  check(token: string) {
    if (!token) {
      return false;
    }

    return true;
  }
}
