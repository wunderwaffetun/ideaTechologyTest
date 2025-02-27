/* eslint-disable node/no-process-env */
import fs from 'fs'
import path from 'path'
import { zEnvHost, zEnvNonemptyTrimmed, zEnvNonemptyTrimmedRequiredOnNotLocal } from '@ideanick/shared/src/zod'
import * as dotenv from 'dotenv'
import { z } from 'zod'

const findEnvFilePath = (dir: string, pathPart: string): string | null => {
  const maybeEnvFilePath = path.join(dir, pathPart)
  if (fs.existsSync(maybeEnvFilePath)) {
    return maybeEnvFilePath
  }
  if (dir === '/') {
    return null
  }
  return findEnvFilePath(path.dirname(dir), pathPart)
}
const webappEnvFilePath = findEnvFilePath(__dirname, 'webapp/.env')
if (webappEnvFilePath) {
  dotenv.config({ path: webappEnvFilePath, override: true })
  dotenv.config({ path: `${webappEnvFilePath}.${process.env.NODE_ENV}`, override: true })
}
const backendEnvFilePath = findEnvFilePath(__dirname, 'backend/.env')
if (backendEnvFilePath) {
  dotenv.config({ path: backendEnvFilePath, override: true })
  dotenv.config({ path: `${backendEnvFilePath}.${process.env.NODE_ENV}`, override: true })
}

const zEnv = z.object({
  NODE_ENV: z.enum(['test', 'development', 'production']),
  PORT: zEnvNonemptyTrimmed,
  HOST_ENV: zEnvHost,
  DATABASE_URL: zEnvNonemptyTrimmed.refine((val) => {
    if (process.env.NODE_ENV !== 'test') {
      return true
    }
    const [databaseUrl] = val.split('?')
    const [databaseName] = databaseUrl.split('/').reverse()
    return databaseName.endsWith('-test')
  }, `Data base name should ends with "-test" on test environment`),
  JWT_SECRET: zEnvNonemptyTrimmed,
  PASSWORD_SALT: zEnvNonemptyTrimmed,
  INITIAL_ADMIN_PASSWORD: zEnvNonemptyTrimmed,
  WEBAPP_URL: zEnvNonemptyTrimmed,
  BREVO_API_KEY: z.string().default(""),
  FROM_EMAIL_NAME: z.string().default(""),
  FROM_EMAIL_ADDRESS: z.string().default(""),
  DEBUG: z
    .string()
    .optional()
    .refine(
      (val) => process.env.HOST_ENV === 'local' || process.env.NODE_ENV !== 'production' || (!!val && val.length > 0),
      'Required on not local host on production'
    ),
  BACKEND_SENTRY_DSN: zEnvNonemptyTrimmedRequiredOnNotLocal,
  SOURCE_VERSION: zEnvNonemptyTrimmedRequiredOnNotLocal,
  CLOUDINARY_API_KEY: zEnvNonemptyTrimmedRequiredOnNotLocal,
  CLOUDINARY_API_SECRET: zEnvNonemptyTrimmedRequiredOnNotLocal,
  CLOUDINARY_CLOUD_NAME: zEnvNonemptyTrimmed,
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_BUCKET_NAME: z.string().default(""),
  S3_REGION: z.string().default(""),
  S3_URL: z.string().default(""),
})

export const env = zEnv.parse(process.env)
