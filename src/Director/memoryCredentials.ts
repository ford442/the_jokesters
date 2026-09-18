/** Live accessor for the current profile's HF cloud credentials (token can rotate mid-session). */
export interface CloudCredentialsSource {
    getToken(): string | null;
    getRepoId(): string | null;
}
