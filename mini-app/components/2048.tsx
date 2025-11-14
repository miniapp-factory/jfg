"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

type Grid = number[][];

function randomTileValue(): number {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function addRandomTile(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = randomTileValue();
  return newGrid;
}

function initGrid(): Grid {
  let grid: Grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

function slideAndMerge(row: number[]): { newRow: number[]; merged: boolean } {
  const nonZero = row.filter(v => v !== 0);
  const mergedRow: number[] = [];
  let merged = false;
  let i = 0;
  while (i < nonZero.length) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      mergedRow.push(nonZero[i] * 2);
      merged = true;
      i += 2;
    } else {
      mergedRow.push(nonZero[i]);
      i += 1;
    }
  }
  while (mergedRow.length < GRID_SIZE) mergedRow.push(0);
  return { newRow: mergedRow, merged };
}

function transpose(grid: Grid): Grid {
  return grid[0].map((_, i) => grid.map(row => row[i]));
}

function reverse(grid: Grid): Grid {
  return grid.map(row => [...row].reverse());
}

function move(grid: Grid, direction: "up" | "down" | "left" | "right"): { newGrid: Grid; moved: boolean } {
  let transformed = grid;
  if (direction === "up") transformed = transpose(grid);
  if (direction === "down") transformed = reverse(transpose(grid));
  if (direction === "right") transformed = reverse(grid);

  let moved = false;
  const newTransformed = transformed.map(row => {
    const { newRow, merged } = slideAndMerge(row);
    if (!merged && !row.every((v, i) => v === newRow[i])) moved = true;
    return newRow;
  });

  let finalGrid = newTransformed;
  if (direction === "up") finalGrid = transpose(newTransformed);
  if (direction === "down") finalGrid = transpose(reverse(newTransformed));
  if (direction === "right") finalGrid = reverse(newTransformed);

  return { newGrid: finalGrid, moved };
}

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(initGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const updateScore = useCallback((newGrid: Grid) => {
    const newScore = newGrid.flat().reduce((a, b) => a + b, 0);
    setScore(newScore);
  }, []);

  const handleMove = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (gameOver) return;
      const { newGrid, moved } = move(grid, direction);
      if (!moved) return;
      const afterMove = addRandomTile(newGrid);
      setGrid(afterMove);
      updateScore(afterMove);
      if (afterMove.flat().some(v => v >= 2048)) setWon(true);
      if (!afterMove.flat().some(v => v === 0) && !canMove(afterMove)) setGameOver(true);
    },
    [grid, gameOver, updateScore]
  );

  const canMove = (g: Grid) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c + 1 < GRID_SIZE && g[r][c] === g[r][c + 1]) return true;
        if (r + 1 < GRID_SIZE && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") handleMove("up");
      if (e.key === "ArrowDown") handleMove("down");
      if (e.key === "ArrowLeft") handleMove("left");
      if (e.key === "ArrowRight") handleMove("right");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">2048</h1>
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((value, idx) => (
          <div
            key={idx}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-md text-xl font-semibold",
              value === 0
                ? "bg-gray-200"
                : value < 64
                ? "bg-yellow-200 text-yellow-800"
                : value < 256
                ? "bg-yellow-300 text-yellow-800"
                : value < 1024
                ? "bg-yellow-400 text-yellow-800"
                : "bg-yellow-500 text-yellow-800"
            )}
          >
            {value !== 0 ? value : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleMove("up")}>↑</Button>
        <Button onClick={() => handleMove("left")}>←</Button>
        <Button onClick={() => handleMove("right")}>→</Button>
        <Button onClick={() => handleMove("down")}>↓</Button>
      </div>
      <div className="text-lg">Score: {score}</div>
      {won && <div className="text-green-600 font-bold">You reached 2048!</div>}
      {gameOver && <div className="text-red-600 font-bold">Game Over</div>}
    </div>
  );
}
