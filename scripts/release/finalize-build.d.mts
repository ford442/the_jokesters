export interface FinalBuildVersion {
  sha: string
  builtAt: string
  dirty: boolean
}

export declare function finalizeBuild(options?: {
  rootDir?: string
  distDir?: string
  builtAt?: Date
  sha?: string
  dirty?: boolean
}): FinalBuildVersion
