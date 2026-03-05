/*
Causes Warning:
Warning: Failed to load the ES module: jest.config.ts. Make sure to set "type": "module" in the nearest package.json file or use the .mjs extension.
*/

import type { Config } from 'jest';

const config: Config = {
    // Use the ts-jest preset to transform TypeScript files
    preset: 'ts-jest', 
    testEnvironment: 'node', // Use 'node' or 'jsdom' depending on your project type
    // Optional: further configuration can go here
    /*  
        These lines below are example options for code coverage and test matching, you can customize them as needed
        They came from a previous project
    */
   
    // setupFilesAfterEnv: ['./jest.setup.ts'],
    // collectCoverage: true,
    // coverageDirectory: "coverage",
    // coverageReporters: ["json-summary", "text", "lcov"],
    // testMatch: ["**/__apitests__/**/*.test.ts", "**/__tests__/**/*.test.ts"],
};

export default config;
