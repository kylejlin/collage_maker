import { Component, createRef, ReactNode } from "react";

enum SpriteAdjustmentKind {
  Translate = "Translate",
  Scale = "Scale",
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg"];

type Props = object;

interface State {
  readonly isProcessingFile: boolean;
  readonly imageFiles: readonly ImageFile[];
  readonly canvasWidthInput: string;
  readonly canvasHeightInput: string;
  readonly canvasScaleInput: string;
  readonly canvasBackgroundColorInput: string;
  readonly sprites: readonly Sprite[];
  readonly adjustment: null | SpriteAdjustment;
}

interface ImageFile {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
  readonly url: string;
  readonly imageElement: HTMLImageElement;
}

interface Sprite {
  readonly name: string;
  readonly id: number;
  readonly image: ImageFile;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

type SpriteAdjustment = SpriteTranslation | SpriteScaling;

interface SpriteTranslation {
  readonly kind: SpriteAdjustmentKind.Translate;
  readonly spriteId: number;
  readonly pointerStartX: number;
  readonly pointerStartY: number;
  readonly pointerCurrentX: number;
  readonly pointerCurrentY: number;
}

interface SpriteScaling {
  readonly kind: SpriteAdjustmentKind.Scale;
  readonly spriteId: number;
  readonly pointerStartX: number;
  readonly pointerStartY: number;
  readonly pointerCurrentX: number;
  readonly pointerCurrentY: number;
}

export class App extends Component<Props, State> {
  readonly canvasRef: React.RefObject<HTMLCanvasElement>;
  readonly fileInputRef: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props);

    this.state = {
      isProcessingFile: false,
      imageFiles: [],
      canvasWidthInput: "1170",
      canvasHeightInput: "2532",
      canvasScaleInput: "0.5",
      canvasBackgroundColorInput: "transparent",
      sprites: [],
      adjustment: null,
    };

    this.canvasRef = createRef();
    this.fileInputRef = createRef();

    this.bindMethods();
  }

  componentDidMount(): void {
    this.updateCanvas();
  }

  bindMethods(): void {
    this.onFileInputChange = this.onFileInputChange.bind(this);
    this.onCanvasWidthInputChange = this.onCanvasWidthInputChange.bind(this);
    this.onCanvasHeightInputChange = this.onCanvasHeightInputChange.bind(this);
    this.onCanvasScaleInputChange = this.onCanvasScaleInputChange.bind(this);
    this.onCanvasBackgroundColorInputChange =
      this.onCanvasBackgroundColorInputChange.bind(this);
    this.onUploadButtonClick = this.onUploadButtonClick.bind(this);
  }

  override setState<K extends keyof State>(
    state:
      | ((
          prevState: Readonly<State>,
          props: Readonly<Props>
        ) => Pick<State, K> | State | null)
      | (Pick<State, K> | State | null),
    callback?: () => void
  ): void;
  override setState<K extends keyof State>(
    state:
      | ((
          prevState: Readonly<State>,
          props: Readonly<Props>
        ) => Pick<State, K> | State | null)
      | (Pick<State, K> | State | null),
    callback?: () => void
  ): ReturnType<App["setState"]> {
    super.setState(state, (): void => {
      this.updateCanvas();

      if (typeof callback === "function") {
        callback();
      }
    });
  }

  render(): ReactNode {
    const {
      isProcessingFile,
      imageFiles,
      canvasWidthInput,
      canvasHeightInput,
      canvasScaleInput,
      canvasBackgroundColorInput,
    } = this.state;

    return (
      <div>
        <div className="Collage">
          <canvas
            className={
              "CollageCanvas" +
              (isCanvasBackgroundColorOpaque(canvasBackgroundColorInput)
                ? ""
                : " CheckerboardBackground")
            }
            ref={this.canvasRef}
          ></canvas>
        </div>
        <div className="Toolbar">
          <div className="ToolbarSection Toolbar__Settings">
            <h2 className="SectionLabel">Canvas size</h2>
            <label className="Toolbar__TextSetting">
              Width:{" "}
              <input
                className={
                  isNonNegativeIntegerString(canvasWidthInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasWidthInput}
                onChange={this.onCanvasWidthInputChange}
              />
            </label>
            <label className="Toolbar__TextSetting">
              Height:{" "}
              <input
                className={
                  isNonNegativeIntegerString(canvasHeightInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasHeightInput}
                onChange={this.onCanvasHeightInputChange}
              />
            </label>
          </div>
          <div className="ToolbarSection Toolbar__Settings">
            <h2>Canvas view</h2>
            <label className="Toolbar__TextSetting">
              Scale:{" "}
              <input
                className={
                  isNonNegativeRealString(canvasScaleInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasScaleInput}
                onChange={this.onCanvasScaleInputChange}
              />
            </label>
            <label className="Toolbar__TextSetting">
              Background (hex):{" "}
              <input
                className={
                  isCanvasBackgroundColorValid(canvasBackgroundColorInput)
                    ? ""
                    : "Input--invalid"
                }
                type="text"
                value={canvasBackgroundColorInput}
                placeholder="#ffffff"
                onChange={this.onCanvasBackgroundColorInputChange}
              />
            </label>
          </div>
          <div className="ToolbarSection ImageLibrary">
            <h2 className="SectionLabel">Images</h2>
            <ul className="ImageLibrary__ImageList">
              {imageFiles.map((imageFile, index) => (
                <li
                  key={String(index) + ":" + imageFile.name}
                  className="ImageLibrary__ImageListItem"
                >
                  <button
                    onClick={() => {
                      this.createSpriteFromImage(imageFile);
                    }}
                  >
                    Add
                  </button>{" "}
                  {imageFile.name}
                </li>
              ))}
            </ul>
            <div className="Toolbar__Upload">
              <input
                className="HiddenWithNegativeZIndex"
                type="file"
                accept={[".zip"].concat(IMAGE_EXTENSIONS).join(",")}
                multiple
                onChange={this.onFileInputChange}
                ref={this.fileInputRef}
              />

              {isProcessingFile ? (
                <p>Processing file...</p>
              ) : (
                <button onClick={this.onUploadButtonClick}>Upload new</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  updateCanvas(): void {
    const canvas = this.canvasRef.current;

    if (canvas === null) {
      return;
    }

    updateCanvasSize(canvas, this.state);
    updateCanvasBackgroundColor(canvas, this.state);
    paintCanvas(canvas, this.state);
  }

  onFileInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;

    if (files === null) {
      return;
    }

    this.setState(
      {
        isProcessingFile: true,
      },
      () => {
        void Promise.all(
          Array.from(files).map((file) => {
            if (!isImageFileName(file.name)) {
              const errorMessage = "Invalid file type. File name: " + file.name;
              window.alert(errorMessage);
              throw new Error(errorMessage);
            }

            return file
              .arrayBuffer()
              .then((buffer) =>
                loadImageFileFromArrayBuffer(buffer, file.name)
              );
          })
        ).then((newImageFiles) => {
          this.setState((prevState) => {
            const combinedImageFiles = prevState.imageFiles
              .concat(newImageFiles)
              .sort((a, b) => compareStrings(a.name, b.name));
            return {
              isProcessingFile: false,
              imageFiles: combinedImageFiles,
            };
          });
        });
      }
    );
  }

  onCanvasWidthInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      canvasWidthInput: event.target.value,
    });
  }

  onCanvasHeightInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      canvasHeightInput: event.target.value,
    });
  }

  onCanvasScaleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      canvasScaleInput: event.target.value,
    });
  }

  onCanvasBackgroundColorInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    this.setState({
      canvasBackgroundColorInput: event.target.value,
    });
  }

  onUploadButtonClick(): void {
    const fileInput = this.fileInputRef.current;

    if (fileInput === null) {
      return;
    }

    fileInput.click();
  }

  createSpriteFromImage(image: ImageFile): void {
    this.setState((prevState) => {
      const newSprite: Sprite = {
        name: image.name,
        id: getUnusedId(prevState.sprites),
        image,
        x: 0,
        y: 0,
        width: image.width,
      };

      return {
        sprites: prevState.sprites.concat(newSprite),
      };
    });
  }
}

function isImageFileName(name: string): boolean {
  const lowerCaseName = name.toLowerCase();

  if (
    lowerCaseName === "" ||
    lowerCaseName.split(/\/|\\/).slice(-1)[0].startsWith(".")
  ) {
    return false;
  }

  return IMAGE_EXTENSIONS.some((extension) =>
    lowerCaseName.endsWith(extension)
  );
}

function loadImageFileFromArrayBuffer(
  buffer: ArrayBuffer,
  imageName: string
): Promise<ImageFile> {
  const dotlessExtension = getDotlessExtension(imageName);
  if (!isImageFileName("test." + dotlessExtension)) {
    throw new Error("Invalid image file type. Name: " + imageName);
  }

  const blob = new Blob([buffer], {
    type: "image/" + dotlessExtension.toLowerCase(),
  });
  const url = URL.createObjectURL(blob);

  const imageElement = new Image();

  const out = new Promise<ImageFile>((resolve, reject) => {
    imageElement.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      const context = canvas.getContext("2d")!;
      context.drawImage(imageElement, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      resolve({
        name: imageName,
        width: canvas.width,
        height: canvas.height,
        data: imageData.data,
        url,
        imageElement,
      });
    });

    imageElement.addEventListener("error", reject);
  });

  imageElement.src = url;

  return out;
}

function getDotlessExtension(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

function compareStrings(a: string, b: string): number {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

function isNonNegativeIntegerString(value: string): boolean {
  return /^\d+$/.test(value);
}

function isNonNegativeRealString(value: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(value);
}

function isCanvasBackgroundColorValid(value: string): boolean {
  return /^(?:(?:transparent)|(?:\s*)|(?:#?[a-f\d]{6}))$/.test(
    value.toLowerCase()
  );
}

function isCanvasBackgroundColorOpaque(value: string): boolean {
  return /^#?[a-f\d]{6}$/.test(value.toLowerCase());
}

function getUnusedId(sprites: readonly Sprite[]): number {
  if (sprites.length === 0) {
    return 0;
  }

  return 1 + Math.max(...sprites.map((sprite) => sprite.id));
}

function updateCanvasSize(canvas: HTMLCanvasElement, state: State): void {
  const { canvasWidthInput, canvasHeightInput, canvasScaleInput } = state;

  const unscaledCanvasWidth = isNonNegativeIntegerString(canvasWidthInput)
    ? Number.parseInt(canvasWidthInput)
    : 0;

  const unscaledCanvasHeight = isNonNegativeIntegerString(canvasHeightInput)
    ? Number.parseInt(canvasHeightInput)
    : 0;

  const { devicePixelRatio } = window;

  canvas.width = unscaledCanvasWidth * devicePixelRatio;
  canvas.height = unscaledCanvasHeight * devicePixelRatio;

  const scale = isNonNegativeRealString(canvasScaleInput)
    ? Number.parseFloat(canvasScaleInput)
    : 1;

  canvas.style.width =
    String((unscaledCanvasWidth * scale) / devicePixelRatio) + "px";
  canvas.style.height =
    String((unscaledCanvasHeight * scale) / devicePixelRatio) + "px";
}

function updateCanvasBackgroundColor(
  canvas: HTMLCanvasElement,
  state: State
): void {
  const { canvasBackgroundColorInput } = state;

  if (isCanvasBackgroundColorOpaque(canvasBackgroundColorInput)) {
    const hexColor = canvasBackgroundColorInput.startsWith("#")
      ? canvasBackgroundColorInput
      : "#" + canvasBackgroundColorInput;
    canvas.style.backgroundColor = hexColor;
  } else {
    canvas.style.removeProperty("background-color");
  }
}

function paintCanvas(canvas: HTMLCanvasElement, state: State): void {
  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Failed to get 2D context from canvas");
  }

  const { devicePixelRatio } = window;

  context.resetTransform();
  context.scale(devicePixelRatio, devicePixelRatio);

  for (const sprite of state.sprites) {
    context.drawImage(
      sprite.image.imageElement,
      sprite.x,
      sprite.y,
      sprite.width,
      (sprite.width * sprite.image.height) / sprite.image.width
    );
  }
}
