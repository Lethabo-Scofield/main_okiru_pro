/**
 * Pipeline Adapter
 * 
 * Thin re-export layer so the server can import the B-BBEE pipeline
 * from api/pipeline. This adapter re-exports the public API.
 */

// Entity manifest
export {
  buildManifestForSector,
  buildRCOGPGenericManifest,
  getAllManifests,
} from '../api/pipeline/extraction/entityManifest';
export type {
  EntityManifest,
  EntityRequirement,
} from '../api/pipeline/extraction/entityManifest';

// LLM Extractor
export {
  LLMExtractor,
  buildExtractionPrompt,
} from '../api/pipeline/extraction/llmExtractor';
export type {
  LLMExtractionRequest,
  LLMExtractionResult,
} from '../api/pipeline/extraction/llmExtractor';

// Entity → ParseResult mapper
export {
  entityResultsToParseResult,
  buildConfidenceReport,
} from '../api/pipeline/extraction/entityToParseResult';

// Scorecard calculator
export { buildPipelineResult } from '../api/pipeline/buildResult';

// Sector configuration
export {
  getSectorConfig,
  detectSectorFromName,
  listSectorConfigs,
  RCOGP_GENERIC,
  ICT_GENERIC,
  FSC_GENERIC,
  AGRI_GENERIC,
  RCOGP_QSE,
  ICT_QSE,
} from '../api/pipeline/sectorConfig';
export type { SectorConfig } from '../api/pipeline/sectorConfig';

// Types
export type { PipelineResult, PipelineLog } from '../api/pipeline/types';
