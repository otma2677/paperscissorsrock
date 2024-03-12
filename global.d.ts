declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'production';

      PORT: string;
      HOST: string;

      GAME_MAX_GAME: string;
      GAME_MAX_WAIT: string;
      GAME_MAX_ROUNDS: string;

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
