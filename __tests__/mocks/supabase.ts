// Chainable query builder mock
export function createMockQueryBuilder(resolvedData: any = null, resolvedError: any = null) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    maybeSingle: jest.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    then: undefined as any,
  };

  // Make the builder itself resolve like a promise (for queries without .single())
  const promise = Promise.resolve({ data: resolvedData ? [resolvedData] : [], error: resolvedError, count: resolvedData ? 1 : 0 });
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);

  return builder;
}

export function createMockSupabase() {
  const mockStorage = {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: "test.mp4" }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.mp4" } }),
      remove: jest.fn().mockResolvedValue({ error: null }),
    }),
  };

  const mockAuth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };

  const mockFunctions = {
    invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
  };

  const supabase = {
    from: jest.fn().mockReturnValue(createMockQueryBuilder()),
    storage: mockStorage,
    auth: mockAuth,
    functions: mockFunctions,
  };

  return supabase;
}
