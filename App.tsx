import React, { useState, useCallback, ChangeEvent, useEffect, useRef } from 'react';
import { CameraModal } from './components/CameraModal';
import { CropModal } from './components/CropModal';
import CardForm from './components/CardForm';
import {
  IconUpload,
  IconCamera,
  IconX,
  IconCheckCircle,
  IconAlertTriangle,
  IconLoader,
  IconScanLine,
  IconPlusCircle,
  IconTrash,
  IconArrowRight,
  IconTestTube,
  IconChevronUp,
  IconChevronDown
} from './components/Icons';
import type { AppStatus, CardData, CameraTarget, CardSide, Priority } from './types';
import { StatusType } from './types';
// To use Lottie files, you would import the component like this:
// import { DotLottieReact } from '@lottiefiles/dotlottie-react';


const WEBHOOK_URL = 'https://pimaj.app.n8n.cloud/webhook-test/updated-business-card';

// --- Helper Functions ---
const generateUniqueId = () => `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const combineImages = (frontFile: File, backFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const frontImg = new Image();
        const backImg = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }

        let frontLoaded = false;
        let backLoaded = false;

        const drawCanvas = () => {
            if (frontLoaded && backLoaded) {
                const PADDING = 50;
                const LABEL_AREA_HEIGHT = 70;
                const LINE_WIDTH = 4;
                const FONT_SIZE = Math.max(28, Math.round(Math.min(frontImg.width, backImg.width) * 0.045));
                const LABEL_FONT = `600 ${FONT_SIZE}px 'Manrope', sans-serif`;
                
                const LINE_COLOR = '#e2e8f0'; 
                const TEXT_COLOR = '#1e293b';
                const BACKGROUND_COLOR = '#f8fafc'; // slate-50

                const maxWidth = Math.max(frontImg.width, backImg.width);
                const totalHeight = (LABEL_AREA_HEIGHT * 2) + frontImg.height + backImg.height + PADDING;
                
                canvas.width = maxWidth;
                canvas.height = totalHeight;

                ctx.fillStyle = BACKGROUND_COLOR;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                let currentY = 0;

                ctx.font = LABEL_FONT;
                ctx.fillStyle = TEXT_COLOR;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Front', canvas.width / 2, LABEL_AREA_HEIGHT / 2);
                currentY = LABEL_AREA_HEIGHT;

                const frontX = (maxWidth - frontImg.width) / 2;
                ctx.drawImage(frontImg, frontX, currentY);
                currentY += frontImg.height;

                currentY += PADDING / 2;
                ctx.beginPath();
                ctx.moveTo(PADDING * 2, currentY);
                ctx.lineTo(canvas.width - (PADDING * 2), currentY);
                ctx.strokeStyle = LINE_COLOR;
                ctx.lineWidth = LINE_WIDTH;
                ctx.stroke();
                currentY += PADDING / 2;
                
                ctx.fillText('Back', canvas.width / 2, currentY + (LABEL_AREA_HEIGHT / 2));
                currentY += LABEL_AREA_HEIGHT;

                const backX = (maxWidth - backImg.width) / 2;
                ctx.drawImage(backImg, backX, currentY);
                
                canvas.toBlob(blob => {
                    if (blob) {
                        const combinedFile = new File([blob], `combined-${Date.now()}.jpeg`, { type: 'image/jpeg' });
                        resolve(combinedFile);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/jpeg', 0.92);
            }
        };

        frontImg.onload = () => { frontLoaded = true; drawCanvas(); };
        frontImg.onerror = (err) => reject(new Error('Failed to load front image.'));
        backImg.onload = () => { backLoaded = true; drawCanvas(); };
        backImg.onerror = (err) => reject(new Error('Failed to load back image.'));
        frontImg.crossOrigin = 'anonymous';
        backImg.crossOrigin = 'anonymous';
        frontImg.src = URL.createObjectURL(frontFile);
        backImg.src = URL.createObjectURL(backFile);
    });
};


// --- Sub-components ---

const WelcomeScreen: React.FC<{ onNameSubmit: (name: string) => void }> = ({ onNameSubmit }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onNameSubmit(name.trim());
        }
    };

    return (
        <div className="min-h-screen text-slate-900 flex items-center justify-center p-4 selection:bg-blue-500/20">
            <div className="w-full max-w-md mx-auto text-center flex flex-col items-center space-y-6">
                <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full p-4 pulse-glow">
                    <IconScanLine size={48} />
                </div>
                <div className="space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">Welcome!</h1>
                    <p className="text-sm sm:text-base text-slate-500 max-w-sm">Let's get started by entering your name below. This will be used to associate with your scanned cards.</p>
                </div>
                <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full pt-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        className="flex-grow bg-white border border-slate-300 rounded-lg py-2.5 px-4 text-slate-900 placeholder-slate-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all text-sm sm:text-base"
                        aria-label="Your name"
                    />
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="flex items-center justify-center gap-2 py-2.5 px-5 sm:py-3 sm:px-6 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-md"
                    >
                        Continue
                        <IconArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

const StatusAlert: React.FC<{ status: AppStatus }> = ({ status }) => {
    const isSuccess = status.type === StatusType.Success;
    const bgColor = isSuccess ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200';
    const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
    const Icon = isSuccess ? IconCheckCircle : IconAlertTriangle;

    return (
        <div className={`p-3 rounded-xl border ${bgColor} ${textColor} flex items-center space-x-3 transition-all duration-300 shadow-sm`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="text-sm font-medium">{status.message}</span>
        </div>
    );
};

const FloatingLabelInput: React.FC<{id: string, label: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void}> = ({ id, label, value, onChange }) => {
    return (
        <div className="relative">
            <input
                type="text"
                id={id}
                value={value}
                onChange={onChange}
                className="block px-3.5 pb-2.5 pt-4 w-full text-sm sm:text-base text-slate-900 bg-white rounded-lg border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 peer shadow-sm"
                placeholder=" "
            />
            <label
                htmlFor={id}
                className="absolute text-sm sm:text-base text-slate-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
            >
                {label}
            </label>
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [event, setEvent] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [cards, setCards] = useState<CardData[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);
  const [croppingImage, setCroppingImage] = useState<{ src: string; cardId: string; side: CardSide; file: File } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const bulkUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userName && cards.length === 0) {
      addCard();
    }
  }, [userName, cards.length]);

  const addCard = () => {
    const newCard: CardData = {
      id: generateUniqueId(),
      frontImageFile: null,
      frontImagePreview: null,
      backImageFile: null,
      backImagePreview: null,
      priority: 'Medium',
      notes: '',
      showBack: false,
      showDetails: false,
    };
    setCards(prev => [...prev, newCard]);
  };

  const updateCard = (id: string, field: keyof CardData, value: any) => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, [field]: value } : card));
  };
  
  const removeCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };
  
  const removeAllCards = () => {
    if (window.confirm('Are you sure you want to remove all cards? This cannot be undone.')) {
        setCards([]);
    }
  };
  
  const handleFileSelected = useCallback(async (file: File, cardId: string, side: CardSide) => {
    if (!file || !file.type.startsWith('image/')) {
        setStatus({ type: StatusType.Error, message: 'Please select a valid image file.' });
        return;
    }
    try {
        const src = await fileToDataURL(file);
        setCroppingImage({ src, cardId, side, file });
    } catch (error) {
        console.error("Error reading file for cropping:", error);
        setStatus({ type: StatusType.Error, message: 'Could not prepare image for cropping.' });
    }
  }, []);

  const handleBulkUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    setStatus(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    const setAndClearStatus = (newStatus: AppStatus) => {
        setStatus(newStatus);
        setTimeout(() => setStatus(s => (s === newStatus ? null : s)), 3000);
    };

    if (imageFiles.length === 0) {
        setAndClearStatus({ type: StatusType.Error, message: 'No valid image files were selected.' });
        return;
    }

    const newCards: CardData[] = [];
    for (const file of imageFiles) {
        try {
            const preview = await fileToDataURL(file);
            newCards.push({
                id: generateUniqueId(),
                frontImageFile: file,
                frontImagePreview: preview,
                backImageFile: null,
                backImagePreview: null,
                priority: 'Medium',
                notes: '',
                showBack: false,
                showDetails: false,
            });
        } catch (error) {
            console.error(`Failed to read file ${file.name}:`, error);
        }
    }

    if (newCards.length > 0) {
        setCards(prev => [...prev, ...newCards]);
        if (newCards.length === imageFiles.length) {
            setAndClearStatus({ type: StatusType.Success, message: `Added ${newCards.length} new card(s).` });
        } else {
            setAndClearStatus({ type: StatusType.Error, message: `Added ${newCards.length} of ${imageFiles.length} cards. Some failed.` });
        }
    } else {
        setAndClearStatus({ type: StatusType.Error, message: 'Could not process any of the selected images.' });
    }

    if (e.target) {
        e.target.value = '';
    }
  };

  const removeImage = (cardId: string, side: CardSide) => {
    const fileField = side === 'front' ? 'frontImageFile' : 'backImageFile';
    const previewField = side === 'front' ? 'frontImagePreview' : 'backImagePreview';

    setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, [fileField]: null, [previewField]: null } : card
    ));
  };

  const openCameraFor = (cardId: string, side: CardSide) => {
    setCameraTarget({ cardId, side });
    setIsCameraOpen(true);
  };
  
  const openCropperFor = (cardId: string, side: CardSide) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const file = side === 'front' ? card.frontImageFile : card.backImageFile;
    const preview = side === 'front' ? card.frontImagePreview : card.backImagePreview;

    if (file && preview) {
      setCroppingImage({ src: preview, cardId, side, file });
    }
  };

  const handleCameraCapture = useCallback((file: File) => {
    if (cameraTarget) {
      handleFileSelected(file, cameraTarget.cardId, cameraTarget.side);
    }
    setIsCameraOpen(false);
    setCameraTarget(null);
  }, [cameraTarget, handleFileSelected]);

  const handleCropConfirm = async (croppedFile: File) => {
    if (!croppingImage) return;
    const { cardId, side } = croppingImage;
    
    try {
        const preview = await fileToDataURL(croppedFile);
        const fileField = side === 'front' ? 'frontImageFile' : 'backImageFile';
        const previewField = side === 'front' ? 'frontImagePreview' : 'backImagePreview';
        
        setCards(prev => prev.map(card => 
            card.id === cardId ? { ...card, [fileField]: croppedFile, [previewField]: preview } : card
        ));
    } catch (error) {
        console.error("Error processing cropped file:", error);
        setStatus({ type: StatusType.Error, message: 'Error processing cropped image.' });
    } finally {
        setCroppingImage(null);
    }
  };

  const handleSubmit = async () => {
    setStatus(null);
    const originalCardIndices = new Map(cards.map((card, index) => [card.id, index + 1]));
    const validCards = cards.filter(c => c.frontImageFile || c.backImageFile);

    if (!event.trim() || !venue.trim()) {
      setStatus({ type: StatusType.Error, message: 'Please fill in both Event and Venue details.' });
      return;
    }
    if (validCards.length === 0) {
      setStatus({ type: StatusType.Error, message: 'Please add at least one card image (front or back).' });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('userName', userName);
    formData.append('event', event);
    formData.append('venue', venue);

    const processingErrors: string[] = [];
    const cardMetadata: { priority: Priority; notes: string; cardSide: string }[] = [];
    
    const processedCards: { imageFile: File, metadata: { priority: Priority; notes: string; cardSide: string } }[] = [];

    for (const card of validCards) {
        const cardIdentifier = `Card #${originalCardIndices.get(card.id)}`;
        try {
            let cardSide = '';
            let imageFile: File | null = null;

            if (card.frontImageFile && card.backImageFile) {
                cardSide = 'FB';
                imageFile = await combineImages(card.frontImageFile, card.backImageFile);
            } else if (card.frontImageFile) {
                cardSide = 'F';
                imageFile = card.frontImageFile;
            } else if (card.backImageFile) {
                cardSide = 'B';
                imageFile = card.backImageFile;
            }

            if (imageFile) {
                const metadata = {
                    priority: card.priority,
                    notes: card.notes,
                    cardSide: cardSide,
                };
                processedCards.push({ imageFile, metadata });
            }
        } catch (error) {
            console.error(`Error processing ${cardIdentifier}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            processingErrors.push(`${cardIdentifier}: ${errorMessage}`);
        }
    }

    if (processedCards.length === 0) {
        setIsLoading(false);
        const errorMessage = processingErrors.length > 0 
            ? `Failed to process any cards. Errors: ${processingErrors.join('; ')}`
            : 'No valid card images found to submit.';
        setStatus({ type: StatusType.Error, message: errorMessage });
        return;
    }
    
    processedCards.forEach(({ imageFile, metadata }) => {
        cardMetadata.push(metadata);
        formData.append('images', imageFile, imageFile.name);
    });
    
    formData.append('cardData', JSON.stringify(cardMetadata));

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Submission failed: ${response.statusText} - ${text}`);
        }
        
        setShowSuccessModal(true);
        if (processingErrors.length > 0) {
             setStatus({ type: StatusType.Error, message: `Partial Success: Submitted ${processedCards.length} card(s). Some failed: ${processingErrors.join('; ')}` });
        } else {
            // Status for success modal can be set here if needed
        }
        // Clear submitted cards
        const submittedCardIds = new Set(validCards.map(c => c.id));
        setCards(prev => prev.filter(c => !submittedCardIds.has(c.id)));


    } catch (error) {
        console.error('Webhook submission error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setStatus({ type: StatusType.Error, message: `Failed to submit cards. ${errorMessage}` });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setStatus(null);
    if (cards.length === 0) {
        addCard();
    }
  };


  const fillDummyData = () => {
    setEvent("Tech Innovators Summit 2024");
    setVenue("Grand Convention Center");
  };

  const submittableCardCount = cards.filter(c => c.frontImageFile || c.backImageFile).length;

  if (!userName) {
      return <WelcomeScreen onNameSubmit={setUserName} />;
  }
  
  return (
    <div className="min-h-screen text-slate-800 flex flex-col items-center p-4 sm:p-6 selection:bg-blue-500/20">
      <div className="w-full max-w-2xl mx-auto flex-grow flex flex-col">
        <header className="text-center py-6 sm:py-8 relative">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-slate-900 to-slate-700 text-transparent bg-clip-text">Business Card Scanner</h1>
            <p className="text-sm text-slate-500 mt-1">Welcome, {userName}! Ready to scan some cards?</p>
            <button 
                onClick={fillDummyData} 
                className="absolute top-1/2 -translate-y-1/2 right-0 text-slate-400 hover:text-blue-500 transition-colors p-2"
                aria-label="Fill with dummy data"
            >
                <IconTestTube className="w-5 h-5 sm:w-[22px] sm:h-[22px]"/>
            </button>
        </header>

        <main className="flex-grow space-y-8 pb-32 sm:pb-36">
             <div className="bg-white rounded-2xl p-5 space-y-4 shadow-lg shadow-slate-200/50 border border-slate-200/80">
                <h2 className="text-base sm:text-lg font-bold text-slate-700 tracking-wide">Event Details</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FloatingLabelInput id="event" label="Event Name" value={event} onChange={(e) => setEvent(e.target.value)} />
                    <FloatingLabelInput id="venue" label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
                </div>
             </div>
            
            <div className="space-y-5 sm:space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-700 tracking-wide">Manage Cards</h2>
                    {cards.length > 0 && (
                        <button
                            onClick={removeAllCards}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                            aria-label="Clear all cards"
                        >
                            <IconTrash size={16} />
                            <span>Clear All</span>
                        </button>
                    )}
                </div>
                {cards.map((card, index) => (
                    <CardForm 
                        key={card.id} 
                        card={card} 
                        index={index}
                        onUpdate={updateCard} 
                        onRemove={removeCard}
                        onFileSelect={handleFileSelected}
                        onCameraOpen={openCameraFor}
                        onRemoveImage={removeImage}
                        onEditImage={openCropperFor}
                    />
                ))}
                {cards.length === 0 && (
                    <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                        <p className="font-semibold">No cards yet.</p>
                        <p className="text-sm mt-1">Click the "Add Card" button to begin.</p>
                    </div>
                )}
            </div>
        </main>
        
        <footer className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/80">
            <div className="w-full max-w-2xl mx-auto space-y-3">
                 {status && !showSuccessModal && <StatusAlert status={status} />}
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={bulkUploadInputRef}
                        onChange={handleBulkUpload}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={addCard}
                        className="flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-3 sm:py-3 sm:px-4 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-300/50 text-sm shadow-sm"
                        aria-label="Add a single card"
                        >
                        <IconPlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Add Card</span>
                    </button>
                    <button
                        onClick={() => bulkUploadInputRef.current?.click()}
                        className="flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-3 sm:py-3 sm:px-4 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-300/50 text-sm shadow-sm"
                        aria-label="Add multiple cards from files"
                        >
                        <IconUpload className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Add Multiple</span>
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submittableCardCount === 0 || isLoading}
                        className="flex-grow flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-xl disabled:shadow-lg disabled:bg-blue-600"
                    >
                        {isLoading ? <IconLoader size={20} className="animate-spin" /> : <><span>Submit</span> <span>{submittableCardCount || ''}</span></>}
                    </button>
                </div>
            </div>
        </footer>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {croppingImage && (
        <CropModal
            imageSrc={croppingImage.src}
            originalFile={croppingImage.file}
            onConfirm={handleCropConfirm}
            onClose={() => setCroppingImage(null)}
        />
      )}

      {/* Loading State Modal */}
      {isLoading && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 animate-fade-in">
            <img 
              src="https://seedicon-dev-public-images.s3.ap-south-1.amazonaws.com/1758451184206_2pivj7dx4ed_HandLoading.gif" 
              alt="Loading..." 
              className="w-80 h-80"
            />
        </div>
      )}

      {/* Success State Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm text-center p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <img 
                  src="https://seedicon-dev-public-images.s3.ap-south-1.amazonaws.com/1758479682678_dadacob3kc_Confetti.gif" 
                  alt="Success confetti" 
                  className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                />
                <div className="relative flex flex-col items-center space-y-4">
                    <IconCheckCircle size={48} className="text-green-500" />
                    <div className="space-y-1.5">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Success!</h2>
                        <p className="text-slate-500">Your business cards have been submitted.</p>
                    </div>
                    {status?.type === StatusType.Error && (
                        <div className="text-left w-full pt-1">
                            <StatusAlert status={status} />
                        </div>
                    )}
                    <button
                        onClick={handleCloseSuccessModal}
                        className="w-full py-2.5 sm:py-3 px-5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-md hover:shadow-lg !mt-6"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;