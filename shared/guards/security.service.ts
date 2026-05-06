export class SecurityService {
  check(token: string) {
    if (!token) {
      return false;
    }

    return true;
  }
}
