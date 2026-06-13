/**
 * Outcome the executor relays back to the supervisor.
 */
export interface Outcome {
  status: string;
}

/**
 * Run delegates to the agent and translates its result into the wire shape.
 */
export async function run(input: string): Promise<Outcome> {
  return { status: input };
}

/**
 * Logger is the structural interface every adapter satisfies.
 */
export type Logger = {
  info(msg: string): void;
};

/**
 * Adapter wires the Logger surface to a concrete sink.
 */
export class Adapter {
  log(_msg: string): void {
    return;
  }
}
