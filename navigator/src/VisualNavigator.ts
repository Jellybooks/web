/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { INavigator, INavigatorDelegate } from "./Navigator";
import { PaginationView } from "./EPUB/PaginationView";
import { ReadingProgression } from "../../shared-models/src/Publication/ReadingProgression";

export type Point = {
  screenX: number;
  screenY: number;
}

/** A navigator rendering the publication visually on-screen. */
export interface IVisualNavigator extends INavigator {
  
  /** Pagination view. */
  view: PaginationView;
  
  /** Current reading progression direction. */
  readingProgression: ReadingProgression;

  /** Moves to the left content portion (eg. page) relative to the reading progression direction.
   *  @param completion: Called when the transition is completed.
   *  Returns whether the navigator is able to move to the previous content portion. The completion block is only called if true was returned. 
   */
  goLeft(animated: boolean, completion: () => void): boolean;

  /** Moves to the right content portion (eg. page) relative to the reading progression direction.
   *  @param completion: Called when the transition is completed.
   *  Returns whether the navigator is able to move to the previous content portion. The completion block is only called if true was returned.
   */
  goRight(animated: boolean, completion: () => void): boolean;
}

export interface IVisualNavigatorDelegate extends INavigatorDelegate {
  /** Called when the user tapped the publication, and it didn't trigger any internal action.
   *  The point is relative to the navigator's view.
   */
  clicked: (atPoint: Point) => void;
}