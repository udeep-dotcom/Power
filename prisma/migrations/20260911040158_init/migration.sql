-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('NEW', 'FILES_UPLOADED', 'FORM_ANALYZED', 'DOCUMENTS_ANALYZED', 'MAPPING_COMPLETE', 'REVIEW_REQUIRED', 'APPROVED_FOR_GENERATION', 'GENERATED', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('BLANK_FORM', 'SUPPORTING');

-- CreateEnum
CREATE TYPE "FieldDataType" AS ENUM ('TEXT', 'DATE', 'CURRENCY', 'NUMBER', 'ACCOUNT', 'SWIFT', 'CHECKBOX');

-- CreateEnum
CREATE TYPE "ValueSource" AS ENUM ('AI', 'MANUAL');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fingerprint" TEXT,
    "pageWidth" DOUBLE PRECISION,
    "pageHeight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "fontSize" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "alignment" TEXT NOT NULL DEFAULT 'left',
    "maxChars" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "dataType" "FieldDataType" NOT NULL DEFAULT 'TEXT',
    "dateFormat" TEXT,

    CONSTRAINT "TemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "templateId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'NEW',
    "formType" TEXT,
    "supplierName" TEXT,
    "invoiceNumber" TEXT,
    "amount" DECIMAL(18,2),
    "currency" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "pageCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "fontSize" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "dataType" "FieldDataType" NOT NULL DEFAULT 'TEXT',
    "dateFormat" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedValue" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sourceText" TEXT,
    "sourcePage" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extractionMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormValue" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "formFieldId" TEXT NOT NULL,
    "extractedValueId" TEXT,
    "value" TEXT NOT NULL,
    "source" "ValueSource" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "FormTemplate_organizationId_idx" ON "FormTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "TemplateField_templateId_idx" ON "TemplateField"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_documentNumber_key" ON "Transaction"("documentNumber");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_idx" ON "Transaction"("organizationId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Document_transactionId_idx" ON "Document"("transactionId");

-- CreateIndex
CREATE INDEX "Document_fileHash_idx" ON "Document"("fileHash");

-- CreateIndex
CREATE INDEX "FormField_transactionId_idx" ON "FormField"("transactionId");

-- CreateIndex
CREATE INDEX "ExtractedValue_transactionId_idx" ON "ExtractedValue"("transactionId");

-- CreateIndex
CREATE INDEX "ExtractedValue_fieldKey_idx" ON "ExtractedValue"("fieldKey");

-- CreateIndex
CREATE INDEX "FormValue_transactionId_idx" ON "FormValue"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "FormValue_transactionId_formFieldId_key" ON "FormValue"("transactionId", "formFieldId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_transactionId_idx" ON "GeneratedDocument"("transactionId");

-- CreateIndex
CREATE INDEX "AuditLog_transactionId_idx" ON "AuditLog"("transactionId");

-- CreateIndex
CREATE INDEX "AIUsage_transactionId_idx" ON "AIUsage"("transactionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateField" ADD CONSTRAINT "TemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedValue" ADD CONSTRAINT "ExtractedValue_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedValue" ADD CONSTRAINT "ExtractedValue_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormValue" ADD CONSTRAINT "FormValue_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormValue" ADD CONSTRAINT "FormValue_formFieldId_fkey" FOREIGN KEY ("formFieldId") REFERENCES "FormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormValue" ADD CONSTRAINT "FormValue_extractedValueId_fkey" FOREIGN KEY ("extractedValueId") REFERENCES "ExtractedValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsage" ADD CONSTRAINT "AIUsage_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
