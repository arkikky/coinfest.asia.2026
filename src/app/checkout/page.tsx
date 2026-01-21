"use client";
import { Suspense } from "react";
import Container from "@/components/Customs/Container";
import PerviewCheckouts from "@/layouts/Store/PerviewCheckouts";

export default function Checkout() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lg text-gray-600">Loading Checkout...</div>
          </div>
        }
      >
        <Container>
          <PerviewCheckouts />
        </Container>
      </Suspense>
    </>
  );
}
