/**
 * Database Schema
 * 
 * This file documents the proposed schema for persisting analysis results.
 * To implement, choose a database (SQLite, PostgreSQL, MongoDB) and uncomment
 * the appropriate section below.
 */

// ============================================================================
// SQLITE SCHEMA (Recommended for self-hosted, lightweight setup)
// ============================================================================

const sqliteSchema = `
-- Analysis submissions
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    program_name TEXT,
    submission_year INTEGER,
    submitter_email TEXT,
    html_filename TEXT,
    pdf_filename TEXT,
    html_size INTEGER,
    pdf_size INTEGER,
    analysis_status TEXT DEFAULT 'completed',
    notes TEXT
);

-- Analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    analysis_type TEXT, -- 'duplicates', 'fte', 'scholarly'
    severity TEXT, -- 'critical', 'warning', 'success'
    title TEXT,
    content TEXT,
    location TEXT,
    resolution TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewer_notes TEXT,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Analysis summaries
CREATE TABLE IF NOT EXISTS analysis_summaries (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    critical_count INTEGER,
    warning_count INTEGER,
    pass_count INTEGER,
    total_issues INTEGER,
    analysis_duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    submission_id TEXT,
    action TEXT,
    user_identifier TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_submissions_program ON submissions(program_name);
CREATE INDEX IF NOT EXISTS idx_submissions_year ON submissions(submission_year);
CREATE INDEX IF NOT EXISTS idx_analysis_submission ON analysis_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_analysis_severity ON analysis_results(severity);
CREATE INDEX IF NOT EXISTS idx_audit_submission ON audit_log(submission_id);
`;

// ============================================================================
// POSTGRESQL SCHEMA (For production deployment)
// ============================================================================

const postgresSchema = `
-- Analysis submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    program_name VARCHAR(255),
    submission_year INTEGER,
    submitter_email VARCHAR(255),
    html_filename VARCHAR(255),
    pdf_filename VARCHAR(255),
    html_size INTEGER,
    pdf_size INTEGER,
    analysis_status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL,
    analysis_type VARCHAR(50),
    severity VARCHAR(20),
    title VARCHAR(255),
    content TEXT,
    location VARCHAR(255),
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewer_notes TEXT,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Analysis summaries
CREATE TABLE IF NOT EXISTS analysis_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE,
    critical_count INTEGER,
    warning_count INTEGER,
    pass_count INTEGER,
    total_issues INTEGER,
    analysis_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID,
    action VARCHAR(100),
    user_identifier VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- Create indices
CREATE INDEX idx_submissions_program ON submissions(program_name);
CREATE INDEX idx_submissions_year ON submissions(submission_year);
CREATE INDEX idx_submissions_created ON submissions(created_at);
CREATE INDEX idx_analysis_submission ON analysis_results(submission_id);
CREATE INDEX idx_analysis_severity ON analysis_results(severity);
CREATE INDEX idx_audit_submission ON audit_log(submission_id);
`;

// ============================================================================
// MONGODB SCHEMA (For NoSQL approach)
// ============================================================================

const mongodbSchema = {
  submissions: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["createdAt", "htmlFilename", "pdfFilename"],
        properties: {
          _id: { bsonType: "objectId" },
          createdAt: { bsonType: "date" },
          programName: { bsonType: "string" },
          submissionYear: { bsonType: "int" },
          submitterEmail: { bsonType: "string" },
          htmlFilename: { bsonType: "string" },
          pdfFilename: { bsonType: "string" },
          htmlSize: { bsonType: "int" },
          pdfSize: { bsonType: "int" },
          analysisStatus: {
            enum: ["completed", "processing", "failed"],
            description: "Current status of analysis"
          },
          notes: { bsonType: "string" }
        }
      }
    },
    indexes: [
      { key: { programName: 1 } },
      { key: { submissionYear: 1 } },
      { key: { createdAt: -1 } }
    ]
  },

  analysisResults: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["submissionId", "title", "severity"],
        properties: {
          _id: { bsonType: "objectId" },
          submissionId: { bsonType: "objectId" },
          analysisType: { 
            enum: ["duplicates", "fte", "scholarly"],
            bsonType: "string"
          },
          severity: {
            enum: ["critical", "warning", "success"],
            bsonType: "string"
          },
          title: { bsonType: "string" },
          content: { bsonType: "string" },
          location: { bsonType: "string" },
          resolution: { bsonType: "string" },
          createdAt: { bsonType: "date" },
          reviewed: { bsonType: "bool" },
          reviewerNotes: { bsonType: "string" }
        }
      }
    },
    indexes: [
      { key: { submissionId: 1 } },
      { key: { severity: 1 } },
      { key: { analysisType: 1 } }
    ]
  },

  analysisSummaries: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["submissionId"],
        properties: {
          _id: { bsonType: "objectId" },
          submissionId: { bsonType: "objectId" },
          criticalCount: { bsonType: "int" },
          warningCount: { bsonType: "int" },
          passCount: { bsonType: "int" },
          totalIssues: { bsonType: "int" },
          analysisDurationMs: { bsonType: "int" },
          createdAt: { bsonType: "date" }
        }
      }
    },
    indexes: [
      { key: { submissionId: 1 }, unique: true }
    ]
  }
};

module.exports = {
  sqliteSchema,
  postgresSchema,
  mongodbSchema
};
