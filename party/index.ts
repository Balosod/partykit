import type * as Party from "partykit/server";
import type { Poll } from "@/app/types";

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  poll: Poll | undefined;

  async onRequest(req: Party.Request) {
    if (req.method === "POST") {
      const poll = (await req.json()) as Poll;
      console.log("poll", poll);
      this.poll = { ...poll, votes: poll.options.map(() => 0) };
      console.log("poll2", poll);
      this.savePoll();
    }

    if (this.poll) {
      return new Response(JSON.stringify(this.poll), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }

  async onMessage(message: string) {
    console.log("message from client", message);
    if (!this.poll) return;

    const event = JSON.parse(message);
    if (event.type === "vote") {
      console.log("event", event);
      this.poll.votes![event.option] += 1;
      console.log(this.poll);
      this.party.broadcast(JSON.stringify(this.poll));
      this.savePoll();
    }
  }

  async savePoll() {
    if (this.poll) {
      await this.party.storage.put<Poll>("poll", this.poll);
    }
  }

  async onStart() {
    this.poll = await this.party.storage.get<Poll>("poll");
  }
}

Server satisfies Party.Worker;

// import type * as Party from "partykit/server";

// export default class Server implements Party.Server {
//   constructor(readonly party: Party.Party) {}

//   onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
//     // A websocket just connected!
//     console.log(
//       `Connected:
//   id: ${conn.id}
//   room: ${this.party.id}
//   url: ${new URL(ctx.request.url).pathname}`
//     );

//     // let's send a message to the connection
//     conn.send("hello from server");
//   }

//   onMessage(message: string, sender: Party.Connection) {
//     // let's log the message
//     console.log(`connection ${sender.id} sent message: ${message}`);
//     // as well as broadcast it to all the other connections in the room...
//     this.party.broadcast(
//       `${sender.id}: ${message}`,
//       // ...except for the connection it came from
//       [sender.id]
//     );
//   }
// }

// Server satisfies Party.Worker;
