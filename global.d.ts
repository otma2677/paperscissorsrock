declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'production';

      PORT: string;
      HOST: string;

      MYSQL_PORT: string;
      MYSQL_HOST: string;
      MYSQL_PASS: string;
      MYSQL_USER: string;
      MYSQL_SCHEMA: string;
      MYSQL_SSL: string | undefined;
    }
  }
}

export default {};
