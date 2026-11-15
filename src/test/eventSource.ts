// jsdom has no EventSource. This stand-in records each stream the app opens,
// so tests can send it events or make it fail.
export class FakeEventSource extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  static instances: FakeEventSource[] = [];

  readonly url: string;
  readyState = FakeEventSource.CONNECTING;

  constructor(url: string | URL) {
    super();
    this.url = String(url);
    FakeEventSource.instances.push(this);
  }

  close() {
    this.readyState = FakeEventSource.CLOSED;
  }

  // Sends a named event from the server.
  emit(type: string) {
    this.dispatchEvent(new MessageEvent(type, { data: "{}" }));
  }

  // The API refused the stream, so the browser gives up on it.
  refuse() {
    this.readyState = FakeEventSource.CLOSED;
    this.dispatchEvent(new Event("error"));
  }
}

// The streams the app keeps open.
export const openStreams = () =>
  FakeEventSource.instances.filter((source) => source.readyState !== FakeEventSource.CLOSED);
