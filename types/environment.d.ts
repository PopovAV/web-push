export {};


declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY : string; // 👈️ mark optional
      WEB_PUSH_PRIVATE_KEY : string;
      WEB_PUSH_EMAIL: string
      ENV: 'test' | 'dev' | 'prod';
    }
  }
}