"use client";

import Image, { StaticImageData } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Chess, Move, PieceSymbol, Square } from "chess.js";

import bishopImage from "../../Sample/chess_bishop.png";
import kingImage from "../../Sample/chess_king.png";
import knightImage from "../../Sample/chess_knight.png";
import pawnImage from "../../Sample/chess_pawn.png";
import queenImage from "../../Sample/chess_queen.png";
import rookImage from "../../Sample/chess_rook.png";

type Difficulty = "easy" | "normal" | "hard";

type CapturedPiece = {
  color: "w" | "b";
  type: PieceSymbol;
};

const pieceImages: Record<PieceSymbol, StaticImageData> = {
  p: pawnImage,
  n: knightImage,
  b: bishopImage,
  r: rookImage,
  q: queenImage,
  k: kingImage,
};

const pieceValue: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = [8, 7, 6, 5, 4, 3, 2, 1] as const;

function squareColor(fileIndex: number, rankIndex: number) {
  return (fileIndex + rankIndex) % 2 === 0
    ? "bg-stone-200"
    : "bg-orange-100";
}

function pickAiMove(moves: Move[], difficulty: Difficulty) {
  if (moves.length === 0) {
    return null;
  }

  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const scoredMoves = moves
    .map((move) => {
      const captureScore = move.captured ? pieceValue[move.captured] * 10 : 0;
      const centralFileBonus = ["d", "e"].includes(move.to[0]) ? 1 : 0;
      const centralRankBonus = ["4", "5"].includes(move.to[1]) ? 1 : 0;
      const promotionBonus = move.promotion ? pieceValue[move.promotion] * 2 : 0;
      const score =
        captureScore + centralFileBonus + centralRankBonus + promotionBonus;
      return { move, score };
    })
    .sort((a, b) => b.score - a.score);

  if (difficulty === "normal") {
    const candidateCount = Math.max(1, Math.ceil(scoredMoves.length / 2));
    const candidates = scoredMoves.slice(0, candidateCount);
    return candidates[Math.floor(Math.random() * candidates.length)].move;
  }

  return scoredMoves[0].move;
}

function getCapturedPieces(history: Move[]) {
  return history.reduce(
    (acc, move) => {
      if (!move.captured) {
        return acc;
      }

      const capturedPiece: CapturedPiece = {
        color: move.color === "w" ? "b" : "w",
        type: move.captured,
      };

      if (move.color === "w") {
        acc.byPlayer.push(capturedPiece);
      } else {
        acc.byAi.push(capturedPiece);
      }

      return acc;
    },
    {
      byPlayer: [] as CapturedPiece[],
      byAi: [] as CapturedPiece[],
    }
  );
}

function getKingSquare(game: Chess, color: "w" | "b") {
  const board = game.board();

  for (let rank = 0; rank < board.length; rank += 1) {
    for (let file = 0; file < board[rank].length; file += 1) {
      const piece = board[rank][file];
      if (piece?.type === "k" && piece.color === color) {
        return `${files[file]}${8 - rank}` as Square;
      }
    }
  }

  return null;
}

export default function Home() {
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const isAiTurn = !game.isGameOver() && game.turn() === "b";

  const history = useMemo(() => game.history({ verbose: true }), [game]);
  const captured = useMemo(() => getCapturedPieces(history), [history]);

  const checkSquare = useMemo(() => {
    if (!game.isCheck()) {
      return null;
    }

    return getKingSquare(game, game.turn());
  }, [game]);

  const gameResult = useMemo(() => {
    if (!game.isGameOver()) {
      return null;
    }

    if (game.isCheckmate()) {
      return game.turn() === "w" ? "Black wins by checkmate" : "White wins by checkmate";
    }

    if (game.isStalemate()) {
      return "Draw by stalemate";
    }

    if (game.isThreefoldRepetition()) {
      return "Draw by threefold repetition";
    }

    if (game.isInsufficientMaterial()) {
      return "Draw by insufficient material";
    }

    return "Draw";
  }, [game]);

  useEffect(() => {
    if (game.isGameOver() || game.turn() !== "b") {
      return;
    }

    const timer = setTimeout(() => {
      setGame((previousGame) => {
        const nextGame = new Chess(previousGame.fen());
        const aiMoves = nextGame.moves({ verbose: true });
        const selectedMove = pickAiMove(aiMoves, difficulty);

        if (selectedMove) {
          nextGame.move(selectedMove);
        }

        return nextGame;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [game, difficulty]);

  const handleSquareClick = (square: Square) => {
    if (game.isGameOver() || game.turn() !== "w") {
      return;
    }

    if (selectedSquare) {
      const nextGame = new Chess(game.fen());
      const moveResult = nextGame.move({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });

      if (moveResult) {
        setGame(nextGame);
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }
    }

    const piece = game.get(square);

    if (!piece || piece.color !== "w") {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    const nextLegalTargets = game
      .moves({ square, verbose: true })
      .map((move) => move.to as Square);

    setSelectedSquare(square);
    setLegalTargets(nextLegalTargets);
  };

  const restartGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setLegalTargets([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8 lg:flex-row">
        <section className="w-full lg:max-w-3xl">
          <div className="rounded-3xl bg-white p-4 shadow-lg md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold md:text-2xl">Chess vs AI</h1>
              <button
                type="button"
                onClick={restartGame}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                New Game
              </button>
            </div>

            <div className="w-full max-w-[680px]">
              <div className="grid aspect-square grid-cols-8 overflow-hidden rounded-2xl border border-slate-300">
                {ranks.map((rank, rankIndex) =>
                  files.map((file, fileIndex) => {
                    const square = `${file}${rank}` as Square;
                    const piece = game.get(square);
                    const isSelected = square === selectedSquare;
                    const isLegal = legalTargets.includes(square);
                    const isCheckSquare = checkSquare === square;

                    return (
                      <button
                        key={square}
                        type="button"
                        onClick={() => handleSquareClick(square)}
                        className={`relative flex aspect-square items-center justify-center ${squareColor(
                          fileIndex,
                          rankIndex
                        )}`}
                        aria-label={`Square ${square}`}
                      >
                        {isSelected && (
                          <span className="pointer-events-none absolute inset-1 rounded-md border-2 border-sky-400" />
                        )}
                        {isCheckSquare && (
                          <span className="pointer-events-none absolute inset-1 rounded-md bg-red-500/35" />
                        )}
                        {isLegal && (
                          <span className="pointer-events-none absolute h-3 w-3 rounded-full bg-sky-500/70" />
                        )}
                        {piece && (
                          <Image
                            src={pieceImages[piece.type]}
                            alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`}
                            width={80}
                            height={80}
                            className={`pointer-events-none h-[76%] w-[76%] object-contain ${
                              piece.color === "w"
                                ? "brightness-110"
                                : "brightness-0 opacity-85"
                            }`}
                            priority={piece.type === "k" || piece.type === "q"}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="w-full rounded-3xl bg-white p-4 shadow-lg md:p-6 lg:max-w-sm">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Turn</p>
              <p className="mt-1 text-lg font-semibold">
                {game.turn() === "w" ? "White" : "Black"}
              </p>
              <p className="text-sm text-slate-600">
                {isAiTurn
                  ? "AI Thinking..."
                  : game.isGameOver()
                    ? "Game finished"
                    : "Your move"}
              </p>
            </div>

            <div>
              <label htmlFor="difficulty" className="text-sm font-medium text-slate-500">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Captured Pieces (You)</p>
              <div className="mt-2 flex min-h-10 flex-wrap gap-1 rounded-xl bg-slate-100 p-2">
                {captured.byPlayer.length === 0 ? (
                  <span className="text-xs text-slate-500">None</span>
                ) : (
                  captured.byPlayer.map((piece, index) => (
                    <Image
                      key={`player-${piece.color}${piece.type}-${index}`}
                      src={pieceImages[piece.type]}
                      alt={`Captured ${piece.type}`}
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain brightness-0 opacity-85"
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Captured Pieces (AI)</p>
              <div className="mt-2 flex min-h-10 flex-wrap gap-1 rounded-xl bg-slate-100 p-2">
                {captured.byAi.length === 0 ? (
                  <span className="text-xs text-slate-500">None</span>
                ) : (
                  captured.byAi.map((piece, index) => (
                    <Image
                      key={`ai-${piece.color}${piece.type}-${index}`}
                      src={pieceImages[piece.type]}
                      alt={`Captured ${piece.type}`}
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain brightness-110"
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Move History</p>
              <ol className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-slate-100 p-2 text-sm">
                {history.length === 0 ? (
                  <li className="text-slate-500">No moves yet</li>
                ) : (
                  Array.from({ length: Math.ceil(history.length / 2) }, (_, index) => {
                    const whiteMove = history[index * 2];
                    const blackMove = history[index * 2 + 1];
                    return (
                      <li key={`turn-${index + 1}`} className="mb-1 grid grid-cols-[2rem,1fr,1fr] gap-2">
                        <span className="font-medium text-slate-600">{index + 1}.</span>
                        <span>{whiteMove?.san ?? ""}</span>
                        <span>{blackMove?.san ?? ""}</span>
                      </li>
                    );
                  })
                )}
              </ol>
            </div>
          </div>
        </aside>
      </main>

      {gameResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-semibold">Game Over</h2>
            <p className="mt-3 text-slate-600">{gameResult}</p>
            <button
              type="button"
              onClick={restartGame}
              className="mt-5 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
