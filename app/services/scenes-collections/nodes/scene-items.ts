import { Node } from './node';
import { Scene } from '../../scenes/scene';
import { HotkeysNode } from './hotkeys';
import { SourcesService } from '../../sources';
import { ScenesService } from '../../scenes';
import { Inject } from '../../../util/injector';

interface ISchema {
  items: ISceneItemInfo[];
}

export interface ISceneItemInfo {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;
  hotkeys?: HotkeysNode;
  locked?: boolean;
  rotation?: number;
}

interface IContext {
  scene: Scene;
}

export class SceneItemsNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject('SourcesService')
  sourcesService: SourcesService;

  @Inject('ScenesService')
  scenesService: ScenesService;

  getItems(context: IContext) {
    return context.scene.getItems().slice().reverse();
  }

  save(context: IContext): Promise<void> {
    const promises: Promise<ISceneItemInfo>[] = this.getItems(context).map(sceneItem => {
      return new Promise(resolve => {
        const hotkeys = new HotkeysNode();
        hotkeys.save({ sceneItemId: sceneItem.sceneItemId }).then(() => {
          resolve({
            id: sceneItem.sceneItemId,
            sourceId: sceneItem.sourceId,
            x: sceneItem.x,
            y: sceneItem.y,
            scaleX: sceneItem.scaleX,
            scaleY: sceneItem.scaleY,
            visible: sceneItem.visible,
            crop: sceneItem.crop,
            locked: sceneItem.locked,
            hotkeys,
            rotation: sceneItem.rotation
          });
        });
      });
    });

    return new Promise(resolve => {
      Promise.all(promises).then(items => {
        this.data = { items };
        resolve();
      });
    });
  }

  load(context: IContext): Promise<void> {
    context.scene.addSources(this.data.items);

    const promises: Promise<void>[] = [];

    this.data.items.forEach(item => {
      if (item.hotkeys) promises.push(item.hotkeys.load({ sceneItemId: item.id }));
    });

    return new Promise(resolve => {
      Promise.all(promises).then(() => resolve());
    });
  }

}
