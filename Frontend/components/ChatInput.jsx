"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FiImage, FiMic, FiSquare, FiX } from "react-icons/fi";

import { transcribeAudio } from "../lib/api";

export default function ChatInput({
  value,
  onChange,
  onSend,
  language,
  isTyping,
  onStop,
  onTranscript,
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPreparingImages, setIsPreparingImages] = useState(false);
  const [inputStatus, setInputStatus] = useState("");

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";

    textareaRef.current.style.height =
      `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [value]);

  useEffect(() => () => {
    recorderRef.current?.stream
      .getTracks()
      .forEach((track) => track.stop());
  }, []);

  const prepareImage = async (file) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Choose an image file.");
    }

    if (file.size > 15 * 1024 * 1024) {
      throw new Error("Each image must be smaller than 15 MB.");
    }

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      1280 / Math.max(bitmap.width, bitmap.height)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("This image could not be prepared.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    if (dataUrl.length > 6_000_000) {
      throw new Error("This image is too detailed to upload. Try a smaller image.");
    }

    return {
      name: file.name || "pasted-image.jpg",
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  };

  const addImageFiles = async (files) => {
    if (!files.length) return;
    if (attachments.length + files.length > 3) {
      setInputStatus("You can attach up to three images per message.");
      return;
    }

    setIsPreparingImages(true);
    setInputStatus("");
    try {
      const prepared = await Promise.all(files.map(prepareImage));
      setAttachments((current) => [...current, ...prepared]);
    } catch (error) {
      setInputStatus(error.message || "Could not prepare that image.");
    } finally {
      setIsPreparingImages(false);
    }
  };

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    addImageFiles(files);
  };

  const handlePaste = (event) => {
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (!imageFiles.length) return;

    event.preventDefault();
    const pastedText = event.clipboardData.getData("text/plain");
    if (pastedText) {
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      onChange(
        target.value.slice(0, start) + pastedText + target.value.slice(end)
      );
    }

    addImageFiles(imageFiles);
  };

  const handleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setInputStatus("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        const audio = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        if (!audio.size) {
          setInputStatus("No audio was recorded. Try again.");
          return;
        }

        if (audio.size > 24 * 1024 * 1024) {
          setInputStatus("That recording is too large. Record a shorter message.");
          return;
        }

        setIsTranscribing(true);
        setInputStatus("Transcribing audio...");
        try {
          const extension = audio.type.split("/")[1]?.split(";")[0] || "webm";
          const transcript = await transcribeAudio(audio, `voice.${extension}`);
          onTranscript(transcript);
          setInputStatus("Transcript added to your message.");
        } catch (error) {
          setInputStatus(error.message || "Could not transcribe the recording.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setInputStatus("Recording. Press the microphone again to finish.");
    } catch (error) {
      setInputStatus(error.message || "Microphone access was not available.");
    }
  };

  const handleSubmit = () => {
    if (isTyping || isRecording || isTranscribing || isPreparingImages) return;
    onSend(attachments);
    setAttachments([]);
    setInputStatus("");
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-4">
      <div className="mx-auto w-full max-w-4xl">
        {inputStatus && (
          <p className="mb-2 text-xs text-slate-500" role="status" aria-live="polite">
            {inputStatus}
          </p>
        )}
        <div className="relative rounded-2xl border border-slate-300 bg-white shadow-sm transition focus-within:border-[#8E288D] focus-within:ring-2 focus-within:ring-[#8E288D]/10">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {attachments.map((attachment, index) => (
                <div key={`${attachment.name}-${index}`} className="relative">
                  <Image
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    width={128}
                    height={128}
                    unoptimized
                    className="h-16 w-16 rounded-md border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white"
                    title={`Remove ${attachment.name}`}
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
            placeholder={`Message AI Assistant in ${language}...`}
            className="max-h-40 min-h-[58px] w-full resize-none bg-transparent px-4 py-4 pr-28 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelection}
            className="hidden"
          />

          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= 3 || isPreparingImages || isTyping}
              className="input-icon-button"
              title="Attach images"
              aria-label="Attach images"
            >
              {isPreparingImages ? "…" : <FiImage size={17} />}
            </button>

            <button
              type="button"
              onClick={handleRecording}
              disabled={isTranscribing || isTyping}
              className="input-icon-button"
              title={isRecording ? "Finish recording" : "Record voice message"}
              aria-label={isRecording ? "Finish recording" : "Record voice message"}
            >
              {isRecording ? <FiSquare size={15} /> : <FiMic size={17} />}
            </button>

            {isTyping ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white transition hover:bg-slate-700"
                title="Stop generating"
              >
                ■
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!value.trim() && attachments.length === 0}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8E288D] text-lg font-bold text-white transition hover:bg-[#701460] disabled:cursor-not-allowed disabled:opacity-40"
                title={attachments.length ? "Send message with images" : "Send message"}
              >
                ↑
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-slate-400">
          Press Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}