import { Container, type Application } from 'pixi.js';

export interface IScene {
  readonly name: string;
  readonly container: Container;
  onEnter?(data?: unknown): void | Promise<void>;
  onExit?(): void;
  update?(dt: number): void;
}

export class SceneManager {
  private scenes = new Map<string, IScene>();
  private current: IScene | null = null;
  private root: Container;

  constructor(private app: Application) {
    this.root = new Container();
    this.app.stage.addChild(this.root);
  }

  register(scene: IScene): void {
    this.scenes.set(scene.name, scene);
  }

  async switchTo(name: string, data?: unknown): Promise<void> {
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene not found: ${name}`);

    if (this.current) {
      this.current.onExit?.();
      this.root.removeChild(this.current.container);
    }

    this.current = next;
    this.root.addChild(next.container);
    await next.onEnter?.(data);
  }

  update(dt: number): void {
    this.current?.update?.(dt);
  }

  get currentScene(): IScene | null {
    return this.current;
  }
}
