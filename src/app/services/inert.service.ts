import { Injectable } from '@angular/core';
import { UserAgent } from './misc.service';

// import { userDeviceIsMobile } from 'src/main';

//this function is for the purpose of accessibility... basically to make the element or its target inert i.e. hidden from assistive technologies and to remove it from the tab order, and also disable pointer events like mouse clicks or hovers
@Injectable({ providedIn: 'root' })
export class Inert {
  constructor(private userAgent: UserAgent) {}

  make(
    target: HTMLElement,
    inert: boolean,
    excludeChildrenInTabOrder?: boolean,
    targetIsInTabOrder?: boolean
  ) {
    target.style.pointerEvents = inert ? 'none' : 'unset';
    (target as any).ariaHidden = inert ? 'true' : 'false';

    if (targetIsInTabOrder || /^(a|button|input)$/i.test(target.tagName)) {
      target.tabIndex = inert ? -1 : 0;
    }

    if (!this.userAgent.deviceIsMobile) {
      target.classList[inert ? 'add' : 'remove']('inert');

      if (!excludeChildrenInTabOrder) {
        const _inert = (tag: HTMLElement | null) => {
          if (tag) {
            tag.style.pointerEvents = inert ? 'none' : 'unset';
            tag.setAttribute('aria-hidden', inert ? 'true' : 'false');
            tag.tabIndex = inert ? -1 : 0;
          }
        };

        const childrenAnchorTag = target.querySelectorAll('a') as NodeListOf<
          HTMLElement
        >;

        const childrenButtonTag = target.querySelectorAll(
          'button'
        ) as NodeListOf<HTMLElement>;
        const childrenInputTag = target.querySelectorAll('input') as NodeListOf<
          HTMLElement
        >;
        const childrenWithTabIndex = target.querySelectorAll(
          '[tabindex]'
        ) as NodeListOf<HTMLElement>;
        let length = childrenAnchorTag.length;

        if (length < childrenButtonTag.length) {
          length = childrenButtonTag.length;
        }

        if (length < childrenInputTag.length) {
          length = childrenInputTag.length;
        }

        if (length < childrenWithTabIndex.length) {
          length = childrenWithTabIndex.length;
        }

        for (let i = 0; i < length; i++) {
          _inert(childrenAnchorTag[i]);
          _inert(childrenButtonTag[i]);
          _inert(childrenInputTag[i]);
          _inert(childrenWithTabIndex[i]);
        }
      }
    }
  }
}
