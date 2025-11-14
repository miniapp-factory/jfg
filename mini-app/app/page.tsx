import { generateMetadata } from "@/lib/farcaster-embed";
import Game2048 from "@/components/2048";

export { generateMetadata };

export default function Home() {
  return <Game2048 />;
}
