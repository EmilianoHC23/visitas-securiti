import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Crop } from 'lucide-react';

interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
    onSave: (croppedImage: string) => void;
}

interface CropBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
    isOpen,
    imageSrc,
    onClose,
    onSave,
}) => {
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [cropBox, setCropBox] = useState<CropBox>({ x: 50, y: 50, width: 200, height: 200 });
    
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialCropBox, setInitialCropBox] = useState<CropBox>(cropBox);
    
    // Para pinch-to-zoom
    const [isPinching, setIsPinching] = useState(false);
    const [initialDistance, setInitialDistance] = useState(0);
    const [initialScale, setInitialScale] = useState(1);
    
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Cargar dimensiones de la imagen y configurar cropBox inicial
    useEffect(() => {
        if (imageSrc && isOpen) {
            const img = new Image();
            img.onload = () => {
                setImageSize({ width: img.width, height: img.height });
                
                // Obtener tamaño del contenedor
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    setContainerSize({ width: rect.width, height: rect.height });
                    
                    // Configurar cropBox inicial (80% del área visible)
                    const initialSize = Math.min(rect.width, rect.height) * 0.8;
                    setCropBox({
                        x: (rect.width - initialSize) / 2,
                        y: (rect.height - initialSize) / 2,
                        width: initialSize,
                        height: initialSize,
                    });
                }
                
                setPosition({ x: 0, y: 0 });
                setScale(1);
                setRotation(0);
            };
            img.src = imageSrc;
        }
    }, [imageSrc, isOpen]);

    // Calcular distancia entre dos puntos táctiles
    const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // MANEJO DE ARRASTRE DE IMAGEN (Panning)
    const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
        if (isResizing) return;
        e.stopPropagation();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    }, [position, isResizing]);

    const handleImageTouchStart = useCallback((e: React.TouchEvent) => {
        if (isResizing) return;
        
        if (e.touches.length === 2) {
            // Pinch to zoom
            setIsPinching(true);
            const distance = getDistance(e.touches[0], e.touches[1]);
            setInitialDistance(distance);
            setInitialScale(scale);
        } else if (e.touches.length === 1) {
            // Pan
            e.stopPropagation();
            setIsDragging(true);
            const touch = e.touches[0];
            setDragStart({
                x: touch.clientX - position.x,
                y: touch.clientY - position.y,
            });
        }
    }, [position, scale, isResizing]);

    const handleImageMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging) return;
        
        setPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleImageMouseMove = useCallback((e: React.MouseEvent) => {
        handleImageMove(e.clientX, e.clientY);
    }, [handleImageMove]);

    const handleImageTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && isPinching) {
            // Pinch to zoom
            const distance = getDistance(e.touches[0], e.touches[1]);
            const newScale = initialScale * (distance / initialDistance);
            setScale(Math.max(0.5, Math.min(3, newScale)));
        } else if (e.touches.length === 1 && isDragging) {
            // Pan
            const touch = e.touches[0];
            handleImageMove(touch.clientX, touch.clientY);
        }
    }, [isDragging, isPinching, initialDistance, initialScale, handleImageMove]);

    const handleImageEnd = useCallback(() => {
        setIsDragging(false);
        setIsPinching(false);
    }, []);

    // MANEJO DE RESIZE DEL CROP BOX
    const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => {
        e.stopPropagation();
        setIsResizing(true);
        setActiveHandle(handle);
        setInitialCropBox({ ...cropBox });
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        setDragStart({ x: clientX, y: clientY });
    }, [cropBox]);

    const handleResizeMove = useCallback((clientX: number, clientY: number) => {
        if (!isResizing || !activeHandle) return;

        const dx = clientX - dragStart.x;
        const dy = clientY - dragStart.y;
        
        const minSize = 50; // Tamaño mínimo del crop box
        const maxWidth = containerSize.width;
        const maxHeight = containerSize.height;

        let newCropBox = { ...initialCropBox };

        switch (activeHandle) {
            case 'nw': // Esquina superior izquierda
                newCropBox.x = Math.max(0, Math.min(initialCropBox.x + dx, initialCropBox.x + initialCropBox.width - minSize));
                newCropBox.y = Math.max(0, Math.min(initialCropBox.y + dy, initialCropBox.y + initialCropBox.height - minSize));
                newCropBox.width = initialCropBox.width - (newCropBox.x - initialCropBox.x);
                newCropBox.height = initialCropBox.height - (newCropBox.y - initialCropBox.y);
                break;
            case 'ne': // Esquina superior derecha
                newCropBox.y = Math.max(0, Math.min(initialCropBox.y + dy, initialCropBox.y + initialCropBox.height - minSize));
                newCropBox.width = Math.max(minSize, Math.min(initialCropBox.width + dx, maxWidth - initialCropBox.x));
                newCropBox.height = initialCropBox.height - (newCropBox.y - initialCropBox.y);
                break;
            case 'sw': // Esquina inferior izquierda
                newCropBox.x = Math.max(0, Math.min(initialCropBox.x + dx, initialCropBox.x + initialCropBox.width - minSize));
                newCropBox.width = initialCropBox.width - (newCropBox.x - initialCropBox.x);
                newCropBox.height = Math.max(minSize, Math.min(initialCropBox.height + dy, maxHeight - initialCropBox.y));
                break;
            case 'se': // Esquina inferior derecha
                newCropBox.width = Math.max(minSize, Math.min(initialCropBox.width + dx, maxWidth - initialCropBox.x));
                newCropBox.height = Math.max(minSize, Math.min(initialCropBox.height + dy, maxHeight - initialCropBox.y));
                break;
            case 'n': // Lado superior
                newCropBox.y = Math.max(0, Math.min(initialCropBox.y + dy, initialCropBox.y + initialCropBox.height - minSize));
                newCropBox.height = initialCropBox.height - (newCropBox.y - initialCropBox.y);
                break;
            case 's': // Lado inferior
                newCropBox.height = Math.max(minSize, Math.min(initialCropBox.height + dy, maxHeight - initialCropBox.y));
                break;
            case 'w': // Lado izquierdo
                newCropBox.x = Math.max(0, Math.min(initialCropBox.x + dx, initialCropBox.x + initialCropBox.width - minSize));
                newCropBox.width = initialCropBox.width - (newCropBox.x - initialCropBox.x);
                break;
            case 'e': // Lado derecho
                newCropBox.width = Math.max(minSize, Math.min(initialCropBox.width + dx, maxWidth - initialCropBox.x));
                break;
        }

        setCropBox(newCropBox);
    }, [isResizing, activeHandle, dragStart, initialCropBox, containerSize]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        setActiveHandle(null);
    }, []);

    // Event listeners globales para resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            handleResizeMove(e.clientX, e.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleResizeMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const handleEnd = () => {
            handleResizeEnd();
            handleImageEnd();
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleEnd);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleEnd);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleEnd);
            };
        }
    }, [isResizing, handleResizeMove, handleResizeEnd, handleImageEnd]);

    // Rotar imagen 90 grados
    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    // Guardar imagen recortada con compresión estilo WhatsApp
    const handleSave = () => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crear imagen temporal para aplicar transformaciones
        const img = new Image();
        img.onload = () => {
            // Tamaño final de salida (máximo 640px como WhatsApp)
            const maxOutputSize = 640;
            const outputSize = Math.min(maxOutputSize, Math.max(cropBox.width, cropBox.height));
            
            canvas.width = outputSize;
            canvas.height = outputSize;

            // Limpiar canvas
            ctx.clearRect(0, 0, outputSize, outputSize);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputSize, outputSize);

            // Guardar estado del contexto
            ctx.save();

            // Mover al centro del canvas
            ctx.translate(outputSize / 2, outputSize / 2);

            // Aplicar rotación
            ctx.rotate((rotation * Math.PI) / 180);

            // Calcular las dimensiones de la imagen después de la rotación
            const containerRect = containerRef.current!.getBoundingClientRect();
            const imageElement = imageRef.current;
            
            if (!imageElement) return;

            // Calcular el tamaño de la imagen renderizada
            const renderedWidth = imageElement.naturalWidth * scale;
            const renderedHeight = imageElement.naturalHeight * scale;

            // Calcular las coordenadas de recorte relativas a la imagen
            const cropRelativeX = cropBox.x - (containerRect.width / 2 + position.x - renderedWidth / 2);
            const cropRelativeY = cropBox.y - (containerRect.height / 2 + position.y - renderedHeight / 2);

            // Escalar las coordenadas al tamaño original de la imagen
            const scaleRatio = imageElement.naturalWidth / renderedWidth;
            const sourceX = cropRelativeX * scaleRatio;
            const sourceY = cropRelativeY * scaleRatio;
            const sourceWidth = cropBox.width * scaleRatio;
            const sourceHeight = cropBox.height * scaleRatio;

            // Dibujar la imagen recortada
            ctx.drawImage(
                img,
                Math.max(0, sourceX),
                Math.max(0, sourceY),
                Math.min(sourceWidth, img.naturalWidth),
                Math.min(sourceHeight, img.naturalHeight),
                -outputSize / 2,
                -outputSize / 2,
                outputSize,
                outputSize
            );

            // Restaurar estado del contexto
            ctx.restore();

            // Convertir a base64 con compresión estilo WhatsApp (75% calidad para JPEG)
            const croppedImage = canvas.toDataURL('image/jpeg', 0.75);
            onSave(croppedImage);
        };
        img.src = imageSrc;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black z-[60] flex flex-col">
                {/* Header con botones de acción */}
                <div className="flex items-center justify-between px-4 py-3 bg-black text-white">
                    <button
                        onClick={onClose}
                        className="text-base font-normal hover:opacity-70 transition-opacity px-2 py-1"
                    >
                        Cancelar
                    </button>
                    <div className="flex items-center gap-2">
                        <Crop className="w-5 h-5" />
                        <h2 className="text-lg font-medium">Recortar</h2>
                    </div>
                    <button
                        onClick={handleSave}
                        className="text-base font-semibold text-[#25D366] hover:opacity-70 transition-opacity px-2 py-1"
                    >
                        Listo
                    </button>
                </div>

                {/* Área de edición */}
                <div 
                    ref={containerRef}
                    className="flex-1 relative overflow-hidden bg-black"
                    style={{ touchAction: 'none' }}
                >
                    {/* Imagen con transformaciones */}
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        onMouseDown={handleImageMouseDown}
                        onMouseMove={handleImageMouseMove}
                        onMouseUp={handleImageEnd}
                        onMouseLeave={handleImageEnd}
                        onTouchStart={handleImageTouchStart}
                        onTouchMove={handleImageTouchMove}
                        onTouchEnd={handleImageEnd}
                        style={{
                            cursor: isDragging ? 'grabbing' : 'grab',
                        }}
                    >
                        <div
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px)`,
                                pointerEvents: 'none',
                            }}
                        >
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="Editar"
                                className="max-w-none select-none"
                                style={{
                                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center',
                                    transition: rotation % 90 === 0 && !isDragging ? 'transform 0.3s ease-out' : 'none',
                                }}
                                draggable={false}
                            />
                        </div>
                    </div>

                    {/* Overlay oscuro fuera del crop box */}
                    <div className="absolute inset-0 pointer-events-none">
                        <svg className="w-full h-full">
                            <defs>
                                <mask id="crop-mask">
                                    <rect width="100%" height="100%" fill="white" />
                                    <rect
                                        x={cropBox.x}
                                        y={cropBox.y}
                                        width={cropBox.width}
                                        height={cropBox.height}
                                        fill="black"
                                    />
                                </mask>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="rgba(0, 0, 0, 0.6)"
                                mask="url(#crop-mask)"
                            />
                        </svg>
                    </div>

                    {/* Marco de recorte con handles */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            left: cropBox.x,
                            top: cropBox.y,
                            width: cropBox.width,
                            height: cropBox.height,
                        }}
                    >
                        {/* Borde del marco */}
                        <div className="absolute inset-0 border-2 border-white shadow-lg" />

                        {/* Líneas de guía (regla de tercios) */}
                        <div className="absolute inset-0">
                            {/* Líneas verticales */}
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white opacity-50" />
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white opacity-50" />
                            {/* Líneas horizontales */}
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white opacity-50" />
                            <div className="absolute top-2/3 left-0 right-0 h-px bg-white opacity-50" />
                        </div>

                        {/* Handles de las esquinas */}
                        {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => {
                            const positions = {
                                nw: { top: -6, left: -6 },
                                ne: { top: -6, right: -6 },
                                sw: { bottom: -6, left: -6 },
                                se: { bottom: -6, right: -6 },
                            };

                            return (
                                <div
                                    key={handle}
                                    className="absolute pointer-events-auto cursor-nwse-resize"
                                    style={{
                                        ...positions[handle],
                                        width: 40,
                                        height: 40,
                                        display: 'flex',
                                        alignItems: handle.includes('n') ? 'flex-start' : 'flex-end',
                                        justifyContent: handle.includes('w') ? 'flex-start' : 'flex-end',
                                    }}
                                    onMouseDown={(e) => handleResizeStart(e, handle)}
                                    onTouchStart={(e) => handleResizeStart(e, handle)}
                                >
                                    <div className="w-6 h-6 border-4 border-white bg-transparent" style={{
                                        borderTop: handle.includes('n') ? '4px solid white' : 'none',
                                        borderBottom: handle.includes('s') ? '4px solid white' : 'none',
                                        borderLeft: handle.includes('w') ? '4px solid white' : 'none',
                                        borderRight: handle.includes('e') ? '4px solid white' : 'none',
                                    }} />
                                </div>
                            );
                        })}

                        {/* Handles de los lados */}
                        {(['n', 's', 'e', 'w'] as const).map((handle) => {
                            const styles = {
                                n: { top: -4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 8, cursor: 'ns-resize' },
                                s: { bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 8, cursor: 'ns-resize' },
                                e: { right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 40, cursor: 'ew-resize' },
                                w: { left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 40, cursor: 'ew-resize' },
                            };

                            return (
                                <div
                                    key={handle}
                                    className="absolute pointer-events-auto bg-white opacity-0 hover:opacity-30 transition-opacity"
                                    style={styles[handle]}
                                    onMouseDown={(e) => handleResizeStart(e, handle)}
                                    onTouchStart={(e) => handleResizeStart(e, handle)}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Barra de herramientas inferior */}
                <div className="bg-black text-white px-4 py-4">
                    <div className="flex items-center justify-center gap-8">
                        {/* Botón de rotar */}
                        <button
                            onClick={handleRotate}
                            className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity active:scale-95"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                                <RotateCw className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-gray-400">Girar</span>
                        </button>
                    </div>
                </div>

                {/* Canvas oculto para generar la imagen final */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </AnimatePresence>
    );
};
