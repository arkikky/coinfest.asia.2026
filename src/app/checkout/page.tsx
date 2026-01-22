"use client";
import { Suspense } from "react";
import Container from "@/components/Customs/Container";
import PerviewCheckouts from "@/layouts/Store/PerviewCheckouts";
import Footer from "@/layouts/Footers";

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
        <Container className={"px-4 sm:px-20 xl:px-40 py-20"}>
          <PerviewCheckouts />
          <Footer />
        </Container>
      </Suspense>
    </>
  );
}
