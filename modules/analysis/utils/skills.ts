import { embedMany } from "ai";
import { embeddingModel } from "@/lib/ai";

/**
 * Comprehensive dictionary mapping common technology names, abbreviations,
 * and variants to a canonical identifier.
 */
export const ALIASES: Record<string, string> = {
  // JavaScript & TypeScript Ecosystem
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  node: "nodejs",
  nodejs: "nodejs",
  "node.js": "nodejs",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  next: "nextjs",
  nextjs: "nextjs",
  "next.js": "nextjs",
  vue: "vue",
  vuejs: "vue",
  "vue.js": "vue",
  angular: "angular",
  angularjs: "angular",
  "angular.js": "angular",
  svelte: "svelte",
  sveltekit: "svelte",
  remix: "remix",
  remixjs: "remix",
  nuxt: "nuxtjs",
  nuxtjs: "nuxtjs",
  express: "express",
  expressjs: "express",
  nest: "nestjs",
  nestjs: "nestjs",
  redux: "redux",
  reduxtoolkit: "redux",
  rtk: "redux",
  zustand: "zustand",
  mobx: "mobx",
  tailwind: "tailwind",
  tailwindcss: "tailwind",
  "tailwind.css": "tailwind",
  styledcomponents: "styledcomponents",
  "styled-components": "styledcomponents",
  sass: "sass",
  scss: "sass",
  html: "html",
  html5: "html",
  css: "css",
  css3: "css",
  webpack: "webpack",
  vite: "vite",
  vitejs: "vite",
  babel: "babel",
  rollup: "rollup",
  esbuild: "esbuild",
  turbopack: "turbopack",
  jest: "jest",
  vitest: "vitest",
  playwright: "playwright",
  cypress: "cypress",
  mocha: "mocha",
  storybook: "storybook",
  reactnative: "reactnative",
  "react-native": "reactnative",
  electron: "electron",
  electronjs: "electron",

  // Python Ecosystem
  py: "python",
  python: "python",
  python3: "python",
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  "fast-api": "fastapi",
  pandas: "pandas",
  numpy: "numpy",
  scipy: "scipy",
  scikitlearn: "scikitlearn",
  "scikit-learn": "scikitlearn",
  sklearn: "scikitlearn",
  tensorflow: "tensorflow",
  tf: "tensorflow",
  pytorch: "pytorch",
  torch: "pytorch",
  keras: "keras",
  pydantic: "pydantic",
  celery: "celery",
  sqlalchemy: "sqlalchemy",

  // Other Backend & Systems Languages
  golang: "golang",
  go: "golang",
  "c++": "c++",
  cpp: "c++",
  "c#": "c#",
  csharp: "c#",
  dotnet: "dotnet",
  ".net": "dotnet",
  netcore: "dotnet",
  dotnetcore: "dotnet",
  aspnet: "aspnet",
  "asp.net": "aspnet",
  java: "java",
  spring: "springboot",
  springboot: "springboot",
  "spring-boot": "springboot",
  rust: "rust",
  ruby: "ruby",
  rails: "rubyonrails",
  rubyonrails: "rubyonrails",
  "ruby-on-rails": "rubyonrails",
  php: "php",
  laravel: "laravel",
  elixir: "elixir",
  scala: "scala",

  // Cloud & Infrastructure / DevOps
  aws: "aws",
  amazonwebservices: "aws",
  gcp: "googlecloud",
  googlecloud: "googlecloud",
  googlecloudplatform: "googlecloud",
  azure: "azure",
  msazure: "azure",
  microsoftazure: "azure",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  docker: "docker",
  containerization: "docker",
  containers: "docker",
  terraform: "terraform",
  ansible: "ansible",
  helm: "helm",
  "ci/cd": "cicd",
  cicd: "cicd",
  "ci-cd": "cicd",
  continuousintegration: "cicd",
  githubactions: "githubactions",
  ghactions: "githubactions",
  gitlabci: "gitlabci",
  jenkins: "jenkins",
  circleci: "circleci",
  argocd: "argocd",
  prometheus: "prometheus",
  grafana: "grafana",

  // Databases & Caches
  postgres: "postgresql",
  postgresql: "postgresql",
  pg: "postgresql",
  mongo: "mongodb",
  mongodb: "mongodb",
  mysql: "mysql",
  mssql: "sqlserver",
  sqlserver: "sqlserver",
  sqlite: "sqlite",
  sqlite3: "sqlite",
  redis: "redis",
  elasticsearch: "elasticsearch",
  elastic: "elasticsearch",
  es: "elasticsearch",
  cassandra: "cassandra",
  dynamodb: "dynamodb",
  prisma: "prisma",
  drizzle: "drizzle",
  drizzleorm: "drizzle",
  typeorm: "typeorm",
  neo4j: "neo4j",

  // APIs, Messaging & Architecture
  rest: "rest",
  restful: "rest",
  restapi: "rest",
  restapis: "rest",
  graphql: "graphql",
  gql: "graphql",
  grpc: "grpc",
  trpc: "trpc",
  websocket: "websocket",
  websockets: "websocket",
  ws: "websocket",
  kafka: "kafka",
  apachekafka: "kafka",
  rabbitmq: "rabbitmq",
  rmq: "rabbitmq",
  microservices: "microservices",
  microservice: "microservices",

  // Tooling & Methodologies
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  linux: "linux",
  unix: "linux",
  bash: "shell",
  shell: "shell",
  zsh: "shell",
  jira: "jira",
  agile: "agile",
  scrum: "agile",
};

/**
 * Normalizes a raw skill string by lowercasing, trimming, removing non-alphanumeric
 * characters (except +, #, .), and mapping via the alias dictionary.
 */
export function normalize(skill: string): string {
  if (!skill) return "";
  const clean = skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#.]/g, "");
  return ALIASES[clean] ?? clean;
}

/**
 * Computes cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator === 0 ? 0 : dot / denominator;
}

export interface MatchedSkill {
  skill: string;
  matchedWith: string;
  required: boolean;
  pass: 1 | 2 | 3;
  similarity?: number;
}

export interface MissingSkill {
  skill: string;
  required: boolean;
}

export interface SkillMatchResult {
  score: number;
  matched: MatchedSkill[];
  missing: MissingSkill[];
}

/**
 * Three-pass skill matching algorithm:
 * - Pass 1: Exact normalized string match
 * - Pass 2: Alias dictionary match
 * - Pass 3: Embedding cosine similarity (>= 0.75) for semantic near-misses
 *
 * Required skills weight 2x, nice-to-have skills weight 1x.
 */
export async function matchSkills(
  resumeSkills: string[],
  requiredSkills: string[],
  niceToHaveSkills: string[] = []
): Promise<SkillMatchResult> {
  const matched: MatchedSkill[] = [];
  const missing: MissingSkill[] = [];

  const candidatePool = resumeSkills.map((raw) => {
    const clean = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9+#.]/g, "");
    return {
      raw,
      clean,
      norm: ALIASES[clean] ?? clean,
    };
  });

  const jdPool = [
    ...requiredSkills.map((s) => ({
      skill: s,
      required: true,
      clean: s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9+#.]/g, ""),
      norm: normalize(s),
    })),
    ...niceToHaveSkills.map((s) => ({
      skill: s,
      required: false,
      clean: s
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9+#.]/g, ""),
      norm: normalize(s),
    })),
  ];

  const unmatchedJdSkills: typeof jdPool = [];
  const matchedResumeIndices = new Set<number>();

  for (const jdItem of jdPool) {
    // Pass 1: Exact match after lowercasing and basic character cleaning
    let passMatched = false;

    for (let i = 0; i < candidatePool.length; i++) {
      const candidate = candidatePool[i];
      if (candidate.clean === jdItem.clean) {
        matched.push({
          skill: jdItem.skill,
          matchedWith: candidate.raw,
          required: jdItem.required,
          pass: 1,
        });
        matchedResumeIndices.add(i);
        passMatched = true;
        break;
      }
    }

    if (passMatched) continue;

    // Pass 2: Alias dictionary match
    for (let i = 0; i < candidatePool.length; i++) {
      const candidate = candidatePool[i];
      if (candidate.norm === jdItem.norm) {
        matched.push({
          skill: jdItem.skill,
          matchedWith: candidate.raw,
          required: jdItem.required,
          pass: 2,
        });
        matchedResumeIndices.add(i);
        passMatched = true;
        break;
      }
    }

    if (!passMatched) {
      unmatchedJdSkills.push(jdItem);
    }
  }

  // Pass 3: Embedding cosine similarity (>= 0.75) on remaining unmatched skills
  const remainingCandidates = candidatePool.filter((_, idx) => !matchedResumeIndices.has(idx));

  if (unmatchedJdSkills.length > 0 && remainingCandidates.length > 0) {
    try {
      const { embeddings: jdEmbeddings } = await embedMany({
        model: embeddingModel,
        values: unmatchedJdSkills.map((j) => j.skill),
      });

      const { embeddings: candidateEmbeddings } = await embedMany({
        model: embeddingModel,
        values: remainingCandidates.map((c) => c.raw),
      });

      for (let i = 0; i < unmatchedJdSkills.length; i++) {
        const jdItem = unmatchedJdSkills[i];
        const jdVec = jdEmbeddings[i];

        let bestSim = -1;
        let bestCandidateIdx = -1;

        for (let j = 0; j < remainingCandidates.length; j++) {
          const sim = cosineSimilarity(jdVec, candidateEmbeddings[j]);
          if (sim > bestSim) {
            bestSim = sim;
            bestCandidateIdx = j;
          }
        }

        if (bestSim >= 0.75 && bestCandidateIdx >= 0) {
          matched.push({
            skill: jdItem.skill,
            matchedWith: remainingCandidates[bestCandidateIdx].raw,
            required: jdItem.required,
            pass: 3,
            similarity: Math.round(bestSim * 100) / 100,
          });
        } else {
          missing.push({
            skill: jdItem.skill,
            required: jdItem.required,
          });
        }
      }
    } catch {
      // Fallback if embedding API is unavailable or offline
      for (const jdItem of unmatchedJdSkills) {
        missing.push({
          skill: jdItem.skill,
          required: jdItem.required,
        });
      }
    }
  } else {
    for (const jdItem of unmatchedJdSkills) {
      missing.push({
        skill: jdItem.skill,
        required: jdItem.required,
      });
    }
  }

  // Weighted score calculation: required skills weigh 2x, nice-to-haves weigh 1x
  const weightedTotal = requiredSkills.length * 2 + niceToHaveSkills.length * 1;
  const weightedMatched = matched.reduce((sum, item) => sum + (item.required ? 2 : 1), 0);
  const score = weightedTotal > 0 ? Math.round((weightedMatched / weightedTotal) * 100) : 100;

  return {
    score,
    matched,
    missing,
  };
}
