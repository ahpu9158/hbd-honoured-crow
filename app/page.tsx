"use client";
import React, { useEffect, useRef, useState } from "react";

type CreditItem =
  | { type: "image"; img: HTMLImageElement; w: number; h: number }
  | { type: "text"; text: string; w: number };

export default function FlappyBirthday() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  
  const crowY = useRef(300);
  const crowV = useRef(0);

  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);

  const [victory, setVictory] = useState(false);
  const [witchHelped, setWitchHelped] = useState(false);
  const [ending, setEnding] = useState(false);
  const [reviveCount, setReviveCount] = useState(0);

  const GRAVITY = 0.25;
  const JUMP = -4;
  const WIN = 20;

  const imageSources = ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg"];
  const textPool = [
    "แฮปปี้เบิร์ดเดย์กีรติไก่",
    "ขอบคุณที่อยู่กับกุมาตลอดปี",
    "เข้าสู่วัยเลขสองแล้ววววววววว ิิ",
    "แว่ก ๆๆๆๆๆ ",
  ];

  const reset = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;

    crowY.current = 300;
    crowV.current = 0;

    setStarted(false);
    setScore(0);
    setVictory(false);
    setWitchHelped(false);
    setEnding(false);
  };

  const jump = () => {
    if (!started) return setStarted(true);
    if (ending) return;
    crowV.current = JUMP;
  };

  useEffect(() => {
    if (!started) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 420;
    canvas.height = 600;

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#87ceeb");
    sky.addColorStop(1, "#e0f6ff");

    const images = imageSources.map((s) => {
      const i = new Image();
      i.src = s;
      return i;
    });

    let pipes: any[] = [];
    let frame = 0;
    let rescueUsed = false;

    // credits
    let creditQueue: (CreditItem & {
      x: number;
      y: number;
      r: number;
    })[] = [];
    let usedImg = 0;
    let usedTxt = 0;
    let creditX = canvas.width + 80;

    // flock
    let flock: any[] = [];

    const spawnCredit = () => {
      if (usedImg >= images.length && usedTxt >= textPool.length) return;

      const useImg =
        usedImg < images.length &&
        (Math.random() < 0.6 || usedTxt >= textPool.length);

      if (useImg) {
        const s = 80 + Math.random() * 60;
        creditQueue.push({
          type: "image",
          img: images[usedImg++],
          w: s,
          h: s,
          x: creditX,
          y: 120 + Math.random() * 300,
          r: (Math.random() - 0.5) * 0.3,
        });
        creditX += s + 80;
      } else {
        creditQueue.push({
          type: "text",
          text: textPool[usedTxt++],
          w: 240,
          x: creditX,
          y: 120 + Math.random() * 300,
          r: (Math.random() - 0.5) * 0.2,
        });
        creditX += 320;
      }
    };

    const drawCredit = (c: any) => {
      ctx.save();
      ctx.translate(c.x + c.w / 2, c.y);
      ctx.rotate(c.r);

      if (c.type === "image" && c.img.complete) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(-c.w / 2 - 6, -c.h / 2 - 6, c.w + 12, c.h + 12);
        ctx.drawImage(c.img, -c.w / 2, -c.h / 2, c.w, c.h);
      }

      if (c.type === "text") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(-c.w / 2, -24, c.w, 48);
        ctx.fillStyle = "#ec4899";
        ctx.font = "18px serif";
        ctx.textAlign = "center";
        ctx.fillText(c.text, 0, 6);
      }

      ctx.restore();
    };

    const drawCandy = (x: number, y: number, h: number, label?: string) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y, 60, h);
      ctx.fillStyle = "#ff3b3b";
      for (let i = 0; i < h; i += 25) {
        ctx.beginPath();
        ctx.moveTo(x, y + i);
        ctx.lineTo(x + 60, y + i + 15);
        ctx.lineTo(x + 60, y + i + 25);
        ctx.lineTo(x, y + i + 10);
        ctx.fill();
      }
      if (label) {
        ctx.fillStyle = "#ec4899";
        ctx.font = "bold 14px serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x + 30, y - 10);
      }
    };

    const loop = () => {
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // credits
      if (victory && !ending) {
        setWitchHelped(false);
        if (frame % 120 === 0) spawnCredit();
        creditQueue.forEach((c) => {
          c.x -= 1.2;
          drawCredit(c);
        });
        if (
          creditQueue.length &&
          creditQueue[creditQueue.length - 1].x < -200
        ) {
          setEnding(true);
        }
      }

      // flock ending
      if (ending) {
        if (!flock.length) {
          for (let i = 0; i < 40; i++) {
            flock.push({
              x: Math.random() * canvas.width,
              y: canvas.height + Math.random() * 100,
              vy: 1 + Math.random() * 2,
            });
          }
        }
        flock.forEach((b) => {
          b.y -= b.vy;
          ctx.font = "26px serif";
          ctx.fillText("🐦‍⬛", b.x, b.y);
        });
        flock = flock.filter((b) => b.y > -60);
        if (!flock.length) return;
      }

      // physics
      crowV.current += GRAVITY;
      crowY.current += crowV.current;

      ctx.font = "40px serif";
      ctx.fillText("🐦‍⬛", 100, crowY.current);

      // candies
      if (!victory) {
        if (frame % 90 === 0) {
          pipes.push({
            x: canvas.width,
            top: 100 + Math.random() * 200,
            passed: false,
          });
        }

        pipes.forEach((p) => {
          p.x -= 3;
          const gap = 170;
          const next = score + 1;
          let label = `${2005 + next}`;
          if (next === 15) label = "We first met in 2021 ❤️";

          drawCandy(p.x, 0, p.top, label);
          drawCandy(p.x, p.top + gap, canvas.height);

          // collision — neutralized by witch
            if (
            120 > p.x &&
            100 < p.x + 60 &&
            (crowY.current < p.top || crowY.current > p.top + gap)
            ) {
            if (next < 1) {
              reset();
              
            } else {
              rescueUsed = true;
              setWitchHelped(true);
              setReviveCount(c => c + 1);

            }
            }

          if (!p.passed && p.x < 100) {
            p.passed = true;
            setScore((s) => {
              // setWitchHelped(false);
              if (s + 1 >= WIN) setVictory(true);
              return s + 1;
            });
          }
        });
      }

      frame++;
      animRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [started, victory, ending]);

  useEffect(() => {
    if (!witchHelped) return;

    const t = setTimeout(() => {
      setWitchHelped(false);
    }, 50);

    return () => clearTimeout(t);
  }, [witchHelped]);


  return (
  <div
    className="fixed inset-0 bg-sky-200 flex flex-col items-center justify-center"
    onClick={jump}
  >
    {/* REVIVE FLASH */}
    {witchHelped && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          opacity: `${Math.min(0.15 + reviveCount * 0.2, 0.9)}`,
        }}
      >
        <img
          src="/revive.jpg"
          alt="Witch Revive"
          style={{
            opacity: Math.min(0.3 + reviveCount * 0.2, 1),
          }}
          className="w-80 h-80 rounded-xl shadow-2xl animate-[reviveFlash_0.18s_ease-out]"
        />
      </div>
    )}


    {/* SCORE + VICTORY */}
    <div className="absolute top-4 right-4 text-right text-pink-600 font-bold z-50">
      <div className="text-2xl">🍭 {score}/{WIN}</div>

      {victory && (
        <div className="mt-2 text-lg text-green-600">
          สุขสันต์วันนเกิดดดดดดดดดดดดดดด
        </div>
      )}
    </div>

    {/* GAME CANVAS */}
    <canvas
      ref={canvasRef}
      className=""
    />

    {/* START MESSAGE */}
    {!started && (
      <div className="absolute bg-white/80 p-8 rounded-xl mt-24 text-lg z-10">
        Tap to fly 🐦‍⬛
      </div>
    )}
  </div>
);

}
