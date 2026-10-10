'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';

interface BottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
}

export function BottomSheet({
    open,
    onOpenChange,
    title,
    description,
    children,
}: BottomSheetProps) {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 transition-opacity" />
                <Drawer.Content className="bg-[#0a0f1d] border-t border-white/15 flex flex-col rounded-t-[28px] fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 outline-none p-5 sm:p-7 text-white max-w-xl mx-auto shadow-2xl shadow-cyan-500/10">
                    {/* Grab handle for fluid touch drag */}
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/25 mb-4 hover:bg-white/40 transition-colors cursor-grab" />

                    {/* Header */}
                    {(title || description) && (
                        <div className="flex items-start justify-between mb-4 pb-2 border-b border-white/5">
                            <div>
                                {title && (
                                    <Drawer.Title className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                        {title}
                                    </Drawer.Title>
                                )}
                                {description && (
                                    <Drawer.Description className="text-xs sm:text-sm text-gray-400 mt-0.5">
                                        {description}
                                    </Drawer.Description>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Content body */}
                    <div className="overflow-y-auto max-h-[calc(90vh-100px)] py-1">
                        {children}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
