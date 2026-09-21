"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { SliderProps } from "@radix-ui/themes";
import { sliderPropDefs } from "@radix-ui/themes/components/slider.props";
import { extractProps } from "@radix-ui/themes/helpers";
import { marginPropDefs } from "@radix-ui/themes/props";
import { forwardRef, useState, type ElementRef } from "react";
import { clsx } from "clsx";

export interface LabeledSliderProps extends SliderProps {
  /** One accessible name per thumb, in value order (minimum, then maximum). */
  thumbLabels: readonly [string, ...string[]];
  /** Optional localized value including its unit, e.g. "25 kilometres". */
  getValueText?: (value: number, index: number) => string;
}

/** Themes 3.3 styling with explicitly named Radix primitive thumbs. */
export const LabeledSlider = forwardRef<ElementRef<typeof SliderPrimitive.Root>, LabeledSliderProps>(
  ({ thumbLabels, getValueText, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = useState(props.defaultValue ?? [0]);
    const values = props.value ?? uncontrolledValue;
    const { className, color, radius, tabIndex, ...rootProps } = extractProps(
      props, sliderPropDefs, marginPropDefs,
    );

    return (
      <SliderPrimitive.Root
        {...rootProps}
        ref={ref}
        data-accent-color={color}
        data-radius={radius}
        className={clsx("rt-SliderRoot", className)}
        onValueChange={(next) => {
          setUncontrolledValue(next);
          props.onValueChange?.(next);
        }}
      >
        <SliderPrimitive.Track className="rt-SliderTrack">
          <SliderPrimitive.Range
            className={clsx("rt-SliderRange", props.highContrast && "rt-high-contrast")}
            data-inverted={props.inverted || undefined}
          />
        </SliderPrimitive.Track>
        {values.map((value, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className="rt-SliderThumb"
            {...(tabIndex !== undefined ? { tabIndex } : undefined)}
            aria-label={thumbLabels[index]}
            aria-valuetext={getValueText?.(value, index)}
          />
        ))}
      </SliderPrimitive.Root>
    );
  },
);

LabeledSlider.displayName = "LabeledSlider";
