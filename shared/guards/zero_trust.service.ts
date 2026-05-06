export class ZeroTrustService {
  verify(user: any) {
    if (!user.token) {
      return false;
    }

    return true;
  }
}
