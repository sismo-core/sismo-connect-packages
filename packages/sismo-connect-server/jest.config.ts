import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  testEnvironment: "node",
  preset: "ts-jest",
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
export default config;