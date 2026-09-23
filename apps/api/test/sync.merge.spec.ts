import { SyncService } from '../src/sync/sync.service';

describe('field-level last-write-wins', () => {
  const sync = new SyncService(null as never);

  it('takes the client field when its clock is newer', () => {
    const { data, conflicted } = sync.mergeFields(
      { status: 'scheduled', fieldClocks: { status: 10 } },
      { status: 'completed', fieldClocks: { status: 20 } },
    );
    expect(data.status).toBe('completed');
    expect(conflicted).toContain('status');
  });

  it('keeps the server field when the client clock is older', () => {
    const { data } = sync.mergeFields(
      { title: 'server', fieldClocks: { title: 50 } },
      { title: 'client', fieldClocks: { title: 10 } },
    );
    expect(data.title).toBeUndefined();
  });
});
