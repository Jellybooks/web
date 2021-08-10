/* Copyright 2020 Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license,
 * available in the LICENSE file present in the Github repository of the project.
 */

import { ILocator } from "../../shared-models/src/Publication/Locator";
import { Link } from "../../shared-models/src/Publication/Link";
import { Publication } from "../../shared-models/src/Publication/Publication";

export interface INavigator {
  publication: Publication;
  currentLocation: ILocator | null;

  /** Moves to the position in the publication correponding to the given `Locator`.
   *  @param completion: Called when the transition is completed.
   *  Returns whether the navigator is able to move to the locator. The completion block is only called if true was returned. 
   */
  goToLocator(location: ILocator, animated: boolean, completion: () => void): boolean;

  /** Moves to the position in the publication targeted by the given link.
   *  @param completion: Called when the transition is completed.
   *  Returns whether the navigator is able to move to the locator. The completion block is only called if true was returned.
   */
  goToLink(link: Link, animated: boolean, completion: () => void): boolean;

  /** Moves to the next content portion (eg. page) in the reading progression direction.
   *  @param completion: Called when the transition is completed.
   *  Returns whether the navigator is able to move to the next content portion. The completion block is only called if true was returned.
   */
  goForward(animated: boolean, completion: () => void): boolean;

  /** Moves to the previous content portion (eg. page) in the reading progression direction.
   *  @param completion: Called when the transition is completed.
   *  Returns whether the navigator is able to move to the previous content portion. The completion block is only called if true was returned.
   */
  goBackward(animated: boolean, completion: () => void): boolean;
}

export interface INavigatorDelegate {
  /** Called when the current position in the publication changed. You should save the locator here to restore the last read page. */
  locationChanged: (location: ILocator) => void;
  
  /** Called when an error must be reported to the user. */
  presentError: (error: string) => void;

  /** Called when the user tapped an external URL. The default implementation opens the URL with the default browser. */
  presentExternalURL: (url: string) => void;
}