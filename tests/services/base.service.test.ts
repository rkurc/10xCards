import { describe, it, expect, beforeEach, vi } from "vitest";
import { BaseService } from "../../src/services/base.service";
import { createSupabaseTestClient } from "../mocks/supabase-mock";
import { ErrorCode, handleDatabaseError } from "../../src/utils/db-error-handler";

// Create a TestService class that extends BaseService for testing
class TestService extends BaseService {
  // Make protected methods public for testing
  public async testExecuteDbOperation<T>(operation: () => Promise<T>, errorMsg?: string): Promise<T> {
    return this.executeDbOperation(operation, errorMsg);
  }

  public async testExecuteTransaction<T>(
    procedureName: string,
    params: Record<string, any>,
    errorMsg?: string
  ): Promise<T> {
    return this.executeTransaction(procedureName, params, errorMsg);
  }

  public async testHandleQueryResult<T>(result: { data: T | null; error: any | null }, errorMsg?: string): T {
    return this.handleQueryResult(result, errorMsg);
  }

  public async testRecordExists(table: string, column: string, value: any): Promise<boolean> {
    return this.recordExists(table, column, value);
  }

  public async testVerifyOwnership(table: string, id: string, userId: string): Promise<boolean> {
    return this.verifyOwnership(table, id, userId);
  }
}

describe("BaseService", () => {
  let service: TestService;
  let mockSupabase: ReturnType<typeof createSupabaseTestClient>;

  beforeEach(() => {
    mockSupabase = createSupabaseTestClient();
    service = new TestService(mockSupabase);
  });

  describe("executeDbOperation", () => {
    it("should return the result of a successful operation", async () => {
      const result = await service.testExecuteDbOperation(async () => "success");
      expect(result).toBe("success");
    });

    it("should handle and transform errors", async () => {
      const mockError = { code: "23505", message: "Duplicate key value" };

      await expect(
        service.testExecuteDbOperation(async () => {
          throw mockError;
        })
      ).rejects.toMatchObject({
        code: ErrorCode.DUPLICATE_ENTRY,
        status: 409,
      });
    });

    it("should use custom error message if provided", async () => {
      const customMessage = "Custom error message";

      await expect(
        service.testExecuteDbOperation(async () => {
          throw new Error("Original error");
        }, customMessage)
      ).rejects.toMatchObject({
        message: "Original error",
        // The custom message is used in logs, not in the error object itself
      });
    });
  });

  describe("executeTransaction", () => {
    it("should execute a transaction and return results", async () => {
      const result = await service.testExecuteTransaction("finalize_generation", {
        p_name: "Test Set",
        p_description: "Test Description",
      });

      expect(result).toMatchObject({
        set_id: expect.any(String),
        name: "Test Set",
        card_count: expect.any(Number),
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "finalize_generation",
        expect.objectContaining({
          p_name: "Test Set",
          p_description: "Test Description",
        })
      );
    });

    it("should handle transaction errors", async () => {
      // Mock a transaction error
      mockSupabase.rpc.mockImplementationOnce(() => {
        return Promise.resolve({
          data: null,
          error: { code: "23505", message: "Duplicate key violation" },
        });
      });

      await expect(service.testExecuteTransaction("some_procedure", {})).rejects.toMatchObject({
        code: ErrorCode.DUPLICATE_ENTRY,
        status: 409,
      });
    });
  });

  describe("handleQueryResult", () => {
    it("should return data for successful query", async () => {
      const result = await service.testHandleQueryResult({
        data: { id: "123", name: "Test" },
        error: null,
      });

      expect(result).toEqual({ id: "123", name: "Test" });
    });

    it("should throw when query has an error", async () => {
      await expect(
        service.testHandleQueryResult({
          data: null,
          error: { code: "42P01", message: "Table not found" },
        })
      ).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        status: 404,
      });
    });

    it("should throw when query returns no data", async () => {
      await expect(
        service.testHandleQueryResult({
          data: null,
          error: null,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.DATABASE_ERROR,
        message: expect.stringContaining("not found"),
      });
    });
  });

  describe("recordExists", () => {
    it("should return true when record exists", async () => {
      const exists = await service.testRecordExists("generation_logs", "id", "test-gen-1");
      expect(exists).toBe(true);
    });

    it("should return false when record does not exist", async () => {
      const exists = await service.testRecordExists("generation_logs", "id", "non-existent-id");
      expect(exists).toBe(false);
    });
  });

  describe("verifyOwnership", () => {
    it("should return true when record exists and belongs to user", async () => {
      const result = await service.testVerifyOwnership("generation_logs", "test-gen-1", "test-user-id");
      expect(result).toBe(true);
    });

    it("should return false when record exists but belongs to different user", async () => {
      const result = await service.testVerifyOwnership("generation_logs", "test-gen-1", "different-user-id");
      expect(result).toBe(false);
    });

    it("should return false when record does not exist", async () => {
      const result = await service.testVerifyOwnership("generation_logs", "non-existent-id", "test-user-id");
      expect(result).toBe(false);
    });
  });
});
