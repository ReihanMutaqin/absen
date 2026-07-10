declare module "face-api.js" {
  // TinyFaceDetectorOptions
  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }

  export class SsdMobilenetv1Options {
    constructor(options?: { minConfidence?: number });
  }

  export class MtcnnOptions {
    constructor(options?: any);
  }

  // FaceDetection with descriptors
  export interface FaceDetection {
    detection: {
      _score: number;
      _classScore: number;
      _className: string;
      _box: {
        _x: number;
        _y: number;
        _width: number;
        _height: number;
      };
    };
    landmarks: FaceLandmarks;
    descriptor: Float32Array;
    unshiftedLandmarks?: FaceLandmarks;
    alignedRect?: any;
    angle?: { pitch: number; yaw: number; roll: number };
  }

  export interface FaceLandmarks {
    positions: { x: number; y: number }[];
    shift: { x: number; y: number };
    getJawOutline(): { x: number; y: number }[];
    getLeftEyeBrow(): { x: number; y: number }[];
    getRightEyeBrow(): { x: number; y: number }[];
    getNose(): { x: number; y: number }[];
    getLeftEye(): { x: number; y: number }[];
    getRightEye(): { x: number; y: number }[];
    getMouth(): { x: number; y: number }[];
    getRefPointsForAlignment(): { x: number; y: number }[];
  }

  // FaceMatcher
  export class FaceMatcher {
    constructor(inputs: LabeledFaceDescriptors[], distanceThreshold?: number);
    findBestMatch(descriptor: Float32Array): FaceMatch;
    toJSON(): any;
  }

  export class FaceMatch {
    label: string;
    distance: number;
    toString(withDistance?: boolean): string;
  }

  export class LabeledFaceDescriptors {
    constructor(label: string, descriptors: Float32Array[]);
    label: string;
    descriptors: Float32Array[];
    toJSON(): any;
  }

  // Detection result after all chaining
  export interface FaceDetectionWithDescriptor {
    detection: any;
    landmarks: FaceLandmarks;
    descriptor: Float32Array;
    unshiftedLandmarks?: FaceLandmarks;
    alignedRect?: any;
    angle?: { pitch: number; yaw: number; roll: number };
  }

  // Pipeline interfaces for method chaining
  interface WithFaceLandmarksSingle {
    withFaceDescriptors(): Promise<FaceDetectionWithDescriptor | undefined>;
  }

  interface WithFaceLandmarksMultiple {
    withFaceDescriptors(): Promise<FaceDetectionWithDescriptor[]>;
  }

  interface DetectSingleFaceReturn {
    withFaceLandmarks(): WithFaceLandmarksSingle;
  }

  interface DetectAllFacesReturn {
    withFaceLandmarks(): WithFaceLandmarksMultiple;
  }

  // Detect single face
  export function detectSingleFace(
    input: TNetInput,
    options?: TinyFaceDetectorOptions | SsdMobilenetv1Options | MtcnnOptions
  ): DetectSingleFaceReturn;

  // Detect all faces
  export function detectAllFaces(
    input: TNetInput,
    options?: TinyFaceDetectorOptions | SsdMobilenetv1Options | MtcnnOptions
  ): DetectAllFacesReturn;

  // Nets
  export const nets: {
    tinyFaceDetector: any;
    faceLandmark68Net: any;
    faceRecognitionNet: any;
    ssdMobilenetv1: any;
    mtcnn: any;
  };

  // Utility functions
  export function fetchImage(uri: string): Promise<HTMLImageElement>;
  export function resizeResults(results: any, dims: any): any;
  export function matchDimensions(
    canvas: HTMLCanvasElement,
    displaySize: { width: number; height: number },
    useDimensions?: boolean
  ): any;
  export function drawDetections(canvas: HTMLCanvasElement, detections: any): void;
  export function drawFaceLandmarks(canvas: HTMLCanvasElement, landmarks: any): void;
  export function euclideanDistance(arr1: number[] | Float32Array, arr2: number[] | Float32Array): number;

  // Types
  export type TNetInput =
    | HTMLCanvasElement
    | HTMLImageElement
    | HTMLVideoElement
    | Float32Array
    | Uint8Array
    | ImageData
    | any;
}
