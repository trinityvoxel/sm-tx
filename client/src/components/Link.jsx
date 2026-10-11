import React from 'react';
import {linkProps} from '../lib/links.js';
export default function Link({href,rel,target,...props}) {
  return <a {...props} href={href} target={target} {...linkProps(href,rel)} />;
}
