"use client";

import React from "react";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VideoHero } from "@/components/shared/video-hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ImageIcon, Pencil, Info, ArrowRight, X } from "lucide-react";
import { DrawingCanvas } from "@/components/analysis/drawing-canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

/** 클래스별 AI가 인식할 수 있는 요소 (결과 페이지·해석 문구에서 사용하는 요소 포함) */
const RECOGNIZABLE_ELEMENTS: Record<string, string[]> = {
  나무: [
    "나무전체",
    "수관",
    "기둥",
    "가지",
    "뿌리",
    "나뭇잎",
    "열매",
    "그네",
    "다람쥐",
    "새",
    "태양",
    "별",
    "구름",
    "꽃",
    "풀",
  ],
  집: ["집전체", "지붕", "집벽", "문", "창문", "굴뚝"],
  남자사람: ["사람전체", "머리", "얼굴", "눈", "코", "입", "상체", "팔", "다리"],
  여자사람: ["사람전체", "머리", "얼굴", "눈", "코", "입", "상체", "팔", "다리"],
};

export default function AnalysisPage() {
  const router = useRouter();
  const [showIntroModal, setShowIntroModal] = useState(true);
  const createEmptySlots = () =>
    Array.from({ length: 4 }, () => ({
      preview: null as string | null,
      file: null as File | null,
    }));
  const [uploadedImages, setUploadedImages] = useState(createEmptySlots);
  const [inputMode, setInputMode] = useState<"upload" | "draw">("upload");
  const [childInfo, setChildInfo] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [children, setChildren] = useState<
    { id: number; name: string; age: number; gender: string }[]
  >([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [drawingSlotIndex, setDrawingSlotIndex] = useState<number | null>(null);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token")
        : null;
    if (!token) return;
    setChildrenLoading(true);
    fetch(`${apiBaseUrl}/children`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (Array.isArray(list)) setChildren(list);
      })
      .catch(() => setChildren([]))
      .finally(() => setChildrenLoading(false));
  }, [apiBaseUrl]);

  const DIRECT_INPUT_VALUE = "__direct__";
  const handleSelectChild = (childId: string) => {
    const isDirect = childId === DIRECT_INPUT_VALUE || !childId;
    setSelectedChildId(isDirect ? "" : childId);
    if (isDirect) {
      setChildInfo({ name: "", age: "", gender: "" });
      return;
    }
    const child = children.find((c) => c.id === parseInt(childId, 10));
    if (child) {
      setChildInfo({
        name: child.name,
        age: child.age.toString(),
        gender: child.gender,
      });
    }
  };

  const slotConfigs = [
    {
      objectKey: "tree",
      label: "나무",
    },
    {
      objectKey: "house",
      label: "집",
    },
    {
      objectKey: "man",
      label: "남자사람",
    },
    {
      objectKey: "woman",
      label: "여자사람",
    },
  ];

  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const [header, data] = dataUrl.split(",");
    const mimeMatch = header?.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      array[i] = binary.charCodeAt(i);
    }
    return new File([array], filename, { type: mime });
  };

  const resizeImageFile = useCallback(
    async (file: File, maxSize = 1024, quality = 0.82) => {
      const imageUrl = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("이미지 로드 실패"));
          el.src = imageUrl;
        });

        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("캔버스 생성 실패");
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const resizedFile = dataUrlToFile(
          dataUrl,
          file.name.replace(/\.(png|jpg|jpeg|webp)$/i, ".jpg"),
        );
        return { preview: dataUrl, file: resizedFile };
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    },
    [],
  );

  const applyFileToSlot = useCallback(
    async (index: number, file: File) => {
      if (!file.type.startsWith("image/")) return;
      try {
        const resized = await resizeImageFile(file);
        setUploadedImages((prev) => {
          const next = [...prev];
          next[index] = resized;
          return next;
        });
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedImages((prev) => {
            const next = [...prev];
            next[index] = { preview: reader.result as string, file };
            return next;
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [resizeImageFile],
  );

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
  }, []);

  const handleDragLeave = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDraggingIndex((prev) => (prev === index ? null : prev));
  }, []);

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      setDraggingIndex(null);
      const file = e.dataTransfer.files[0];
      if (file) {
        applyFileToSlot(index, file);
      }
    },
    [applyFileToSlot],
  );

  const handleFileSelect = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        applyFileToSlot(index, file);
      }
    },
    [applyFileToSlot],
  );

  const handleAnalyze = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);

    const hasAllImages = uploadedImages.every(
      (slot) => slot.file && slot.preview,
    );
    if (!hasAllImages) {
      setSubmitError("분석에 필요한 그림 4장을 모두 업로드해주세요.");
      setIsSubmitting(false);
      return;
    }
    if (!childInfo.age) {
      setSubmitError("아이의 나이를 선택해주세요.");
      setIsSubmitting(false);
      return;
    }

    const imagePreviews = uploadedImages.map((slot) => slot.preview || "");
    const payload = {
      images: imagePreviews,
      slots: slotConfigs.map((s) => ({
        label: s.label,
        objectKey: s.objectKey,
      })),
      childInfo: {
        name: childInfo.name || "",
        age: childInfo.age || "",
        gender: childInfo.gender || "",
      },
    };
    const files = uploadedImages.map((slot) => slot.file);

    const globalStore = globalThis as typeof globalThis & {
      __analysisPayload?: typeof payload;
      __analysisFiles?: (File | null)[];
    };
    globalStore.__analysisPayload = payload;
    globalStore.__analysisFiles = files;

    setIsSubmitting(false);
    router.push("/analysis/analyzing");
  };

  const handleSaveDrawing = async (imageData: string) => {
    if (drawingSlotIndex === null) return;

    const filename = `${slotConfigs[drawingSlotIndex]?.label || "drawing"}.png`;
    const file = dataUrlToFile(imageData, filename);
    try {
      const resized = await resizeImageFile(file);
      setUploadedImages((prev) => {
        const next = [...prev];
        next[drawingSlotIndex] = resized;
        return next;
      });
    } catch {
      setUploadedImages((prev) => {
        const next = [...prev];
        next[drawingSlotIndex] = { preview: imageData, file };
        return next;
      });
    }
    setDrawingSlotIndex(null);
  };

  const hasAllImages = uploadedImages.every(
    (slot) => slot.file && slot.preview,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* 그림 그리기 안내 모달 (페이지 진입 시 표시) */}
      <Dialog open={showIntroModal} onOpenChange={setShowIntroModal}>
        <DialogContent
          className="min-w-[900px] max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0"
          showCloseButton={true}
        >
          <DialogHeader className="px-6 pt-6 pb-2 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-primary" />
              그림 그리기 안내
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-6">
            <section>
              <h3 className="font-semibold text-foreground mb-2">
                그릴 때 주의사항
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                <li>그림이 잘 보이도록 밝은 곳에서 촬영하거나, 직접 그릴 때는 흰 배경에 검정 펜으로 그려주세요.</li>
                <li>그림 전체가 프레임 안에 들어오도록 해주세요. 잘리지 않게 넉넉히 담아주세요.</li>
                <li>나무, 집, 남자사람, 여자사람 네 가지를 각각 한 장씩 그리거나 촬영해 주세요.</li>
                <li>아이의 나이와 성별을 정확히 선택해 주시면 또래 비교 분석이 가능합니다.</li>
                <li>지원 형식: JPG, PNG, HEIC (최대 10MB). 선명할수록 인식이 좋습니다.</li>
              </ul>
            </section>
            <section>
              <h3 className="font-semibold text-foreground mb-3">
                그려도 좋은 요소 (클래스별 인식 가능 요소)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                아래 요소들을 포함해 그리면 AI가 더 정확하게 분석할 수 있습니다.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {slotConfigs.map((slot) => (
                  <div
                    key={slot.objectKey}
                    className="rounded-xl border border-border/50 bg-muted/30 p-4"
                  >
                    <h4 className="font-medium text-foreground mb-2">
                      {slot.label}
                    </h4>
                    <ul className="flex flex-wrap gap-1.5">
                      {(RECOGNIZABLE_ELEMENTS[slot.label] ?? []).map((el) => (
                        <li
                          key={el}
                          className="text-xs px-2 py-1 rounded-md bg-background border border-border/50 text-muted-foreground"
                        >
                          {el}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Hero */}
      <div className="-mt-14">
        <VideoHero
          subtitle="iSeed 마음검사"
          title="그림 속 작은 신호에서 시작되는 마음 성장"
          description="아이의 그림 4장을 올리면 AI가 마음 신호를 살펴보고, 보호자용 마음 리포트와 맞춤 마음활동을 준비합니다. 이 결과는 전문적인 심리 진단을 대체하지 않습니다."
          height="small"
        />
      </div>

      <main className="flex-1 bg-slate-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-8">
              {/* Upload/Draw Section */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    그림 입력
                  </CardTitle>
                  <CardDescription>
                    그림을 업로드하거나 직접 그려주세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={inputMode}
                    onValueChange={(v) => setInputMode(v as "upload" | "draw")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="upload" className="gap-2">
                        <Upload className="h-4 w-4" />
                        업로드
                      </TabsTrigger>
                      <TabsTrigger value="draw" className="gap-2">
                        <Pencil className="h-4 w-4" />
                        직접 그리기
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-0">
                      <div className="grid gap-4 md:grid-cols-2">
                        {uploadedImages.map((image, index) => {
                          const inputId = `file-upload-${index}`;
                          const isDragging = draggingIndex === index;
                          const slot = slotConfigs[index];
                          return (
                            <div
                              key={inputId}
                              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                                isDragging
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onDragOver={(e) => handleDragOver(index, e)}
                              onDragLeave={(e) => handleDragLeave(index, e)}
                              onDrop={(e) => handleDrop(index, e)}
                            >
                              {image.preview ? (
                                <div className="relative">
                                  <img
                                    src={image.preview}
                                    alt={`${slot.label} 업로드`}
                                    className="w-full rounded-lg border object-cover"
                                  />
                                  <div className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground">
                                    {index + 1}번 · {slot.label}
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() =>
                                      setUploadedImages((prev) => {
                                        const next = [...prev];
                                        next[index] = {
                                          preview: null,
                                          file: null,
                                        };
                                        return next;
                                      })
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-3 py-6">
                                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground mb-1">
                                      {index + 1}번 · {slot.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      드래그하거나 클릭해서 선택
                                    </p>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(index, e)}
                                    className="hidden"
                                    id={inputId}
                                  />
                                  <label htmlFor={inputId}>
                                    <Button
                                      variant="outline"
                                      className="bg-transparent cursor-pointer"
                                      asChild
                                    >
                                      <span>파일 선택</span>
                                    </Button>
                                  </label>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        지원 형식: JPG, PNG, HEIC (최대 10MB)
                      </p>
                    </TabsContent>

                    <TabsContent value="draw" className="mt-0">
                      <div className="grid gap-4 md:grid-cols-2">
                        {slotConfigs.map((slot, index) => {
                          const hasImage = uploadedImages[index]?.preview;
                          return (
                            <div
                              key={index}
                              className={`border-2 rounded-xl p-4 transition-colors ${
                                hasImage
                                  ? "border-primary/50 bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex flex-col items-center gap-3 py-4">
                                {hasImage ? (
                                  <>
                                    <img
                                      src={uploadedImages[index].preview!}
                                      alt={`${slot.label} 그림`}
                                      className="w-full rounded-lg border object-contain max-h-[200px]"
                                    />
                                    <div className="flex gap-2 w-full">
                                      <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                          setUploadedImages((prev) => {
                                            const next = [...prev];
                                            next[index] = {
                                              preview: null,
                                              file: null,
                                            };
                                            return next;
                                          });
                                        }}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        삭제
                                      </Button>
                                      <Button
                                        className="flex-1"
                                        onClick={() =>
                                          setDrawingSlotIndex(index)
                                        }
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        다시 그리기
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Pencil className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="text-center">
                                      <p className="font-medium text-foreground mb-1">
                                        {index + 1}번 · {slot.label}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        그림을 그려주세요
                                      </p>
                                    </div>
                                    <Button
                                      className="w-full"
                                      onClick={() => setDrawingSlotIndex(index)}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      그리기 시작
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground text-center">
                        각 그림을 클릭하여 그릴 수 있습니다. 검정 펜으로
                        그려주세요.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Info Section */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    아이 정보 입력
                  </CardTitle>
                  <CardDescription>
                    등록한 아이를 선택하거나 직접 입력해주세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>아이를 선택하세요</Label>
                    <Select
                      value={selectedChildId || DIRECT_INPUT_VALUE}
                      onValueChange={handleSelectChild}
                      disabled={childrenLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            childrenLoading
                              ? "불러오는 중..."
                              : "아이를 선택하세요 (또는 직접 입력)"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DIRECT_INPUT_VALUE}>
                          직접 입력
                        </SelectItem>
                        {children.map((child) => (
                          <SelectItem
                            key={child.id}
                            value={child.id.toString()}
                          >
                            {child.name} ({child.age}세,{" "}
                            {child.gender === "male" ? "남아" : "여아"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="name">아이 이름</Label>
                      <Input
                        id="name"
                        placeholder="예: 홍길동"
                        value={childInfo.name}
                        onChange={(e) => {
                          setSelectedChildId("");
                          setChildInfo({ ...childInfo, name: e.target.value });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">나이</Label>
                      <Select
                        value={childInfo.age}
                        onValueChange={(value) => {
                          setSelectedChildId("");
                          setChildInfo({ ...childInfo, age: value });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="나이 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 7 }, (_, i) => i + 7).map(
                            (age) => (
                              <SelectItem key={age} value={age.toString()}>
                                {age}세
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">성별</Label>
                      <Select
                        value={childInfo.gender}
                        onValueChange={(value) => {
                          setSelectedChildId("");
                          setChildInfo({ ...childInfo, gender: value });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="성별 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">남아</SelectItem>
                          <SelectItem value="female">여아</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4">
                    {submitError && (
                      <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {submitError}
                      </div>
                    )}
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleAnalyze}
                      disabled={!hasAllImages || !childInfo.age || isSubmitting}
                    >
                      {isSubmitting ? "분석 요청 중..." : "분석 시작하기"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Guide Section */}
            <Card className="mt-8 border-border/50 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  그림 분석 가이드
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        선명한 이미지
                      </p>
                      <p className="text-xs text-muted-foreground">
                        그림이 잘 보이도록 밝은 곳에서 촬영해주세요
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        전체 그림 포함
                      </p>
                      <p className="text-xs text-muted-foreground">
                        그림 전체가 프레임 안에 들어오도록 해주세요
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        정확한 정보
                      </p>
                      <p className="text-xs text-muted-foreground">
                        아이의 나이와 그림 유형을 정확히 선택해주세요
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      {/* Drawing Dialog */}
      <Dialog
        open={drawingSlotIndex !== null}
        onOpenChange={(open) => !open && setDrawingSlotIndex(null)}
      >
        <DialogContent className="min-w-[750px] max-w-none max-h-[90vh] p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {drawingSlotIndex !== null && slotConfigs[drawingSlotIndex]
                ? `${slotConfigs[drawingSlotIndex].label} 그리기`
                : "그림 그리기"}
            </DialogTitle>
          </DialogHeader>
          {drawingSlotIndex !== null && (
            <DrawingCanvas
              onSave={handleSaveDrawing}
              onCancel={() => setDrawingSlotIndex(null)}
              width={500}
              height={500}
              title={slotConfigs[drawingSlotIndex]?.label}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
