// components/Slots/SlotsWrapper.tsx
"use client";

import dynamic from 'next/dynamic';

const SlotsComponent = dynamic(
    () => import('./SlotsComponent'),
    { ssr: false }
);

const SlotsWrapper = () => {
    return <SlotsComponent />;
};

export default SlotsWrapper;
