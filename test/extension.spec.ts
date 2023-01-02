import assert from "assert"
import {
  CustomExtension,
  encode as encoder,
  decode as decoder,
  registerExtension,
} from "../src/index.js"

describe("Custom extension", () => {
  it("Meeting class", () => {
    // Declare classes & types for test
    class Meeting {
      constructor(
        public title: string,
        public startAt: number,
        public people: Person[]
      ) {}
      toJson() {
        return {
          title: this.title,
          startAt: this.startAt,
          people: this.people.map((person) => person.toJson()),
        }
      }
    }

    class Person {
      constructor(public name: string, public food: FoodRequirement) {}
      toJson() {
        return {
          name: this.name,
          food: this.food,
        }
      }
    }

    enum FoodRequirement {
      MeatEaters = 1,
      Vegan = 2,
      LactoVegetarian = 3,
      OvoVegetarian = 4,
      Flexitarian = 5,
    }

    registerExtension({
      type: 1,
      objConstructor: Meeting,
      encode: function (object: Meeting): Uint8Array {
        return encoder(object.toJson())
      },
      decode: function (data: Uint8Array): Meeting {
        const object = decoder(data) as InstanceType<typeof Meeting>
        return new Meeting(
          object.title,
          object.startAt,
          object.people.map(({ name, food }) => new Person(name, food))
        )
      },
    } as CustomExtension<Meeting>)

    // Data
    const people: Person[] = [
      new Person("attendee 1", FoodRequirement.Flexitarian),
      new Person("attendee 2", FoodRequirement.LactoVegetarian),
      new Person("attendee 3", FoodRequirement.MeatEaters),
      new Person("attendee 4", FoodRequirement.OvoVegetarian),
      new Person("attendee 5", FoodRequirement.Vegan),
    ]
    const meeting = new Meeting(
      "We have something to discuss",
      new Date().getTime() / 1000,
      people
    )

    // Test
    assert.deepStrictEqual(decoder(encoder(meeting)), meeting)
  })
})
