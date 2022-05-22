import {
  sanityClient,
  urlFor,
  usePreviewSubscription,
  PortableText,
} from "../../lib/sanity";
import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

const recipeQuery = `*[_type == "recipe" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    mainImage,
    ingredient[] {
        _key,
        unit,
        wholeNumber,
        fraction,
        ingredient->{
            name
        }
    },
    instructions,
    likes
}`;

export default function OneRecipe({ data, preview }) {
  const router = useRouter();
  //   console.log(preview);
  //   console.log(data.recipe);
  //   const { data: recipe } = usePreviewSubscription(recipeQuery, {
  //     params: { slug: data?.recipe?.slug?.current },
  //     initialData: data,
  //     enabled: preview,
  //   });

  const [likes, setLikes] = useState(data?.recipe?.likes);
  const [recipe, setRecipe] = useState(data?.recipe); // comment this to enable livepreview

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  const addLike = async () => {
    const res = await fetch("/api/handle-like", {
      method: "POST",
      body: JSON.stringify({ _id: recipe?._id }),
    }).catch((error) => console.log(error));

    const data = await res.json();
    setLikes(data.likes);
  };

  // const { recipe } = data;

  return (
    <article className="recipe">
      <h1>{recipe?.name}</h1>
      <button className="like-button" onClick={addLike}>
        {likes} ❤
      </button>
      <main className="content">
        {recipe?.mainImage && (
          <Image
            src={urlFor(recipe?.mainImage).url()}
            alt={recipe?.name}
            width="400"
            height="400"
            layout="responsive"
            objectFit="contain"
          />
        )}
        <div className="breakdown">
          <ul className="ingredients">
            {recipe?.ingredient?.map((ingredient) => (
              <li key={ingredient?._key} className="ingredient">
                {ingredient?.wholeNumber}
                {ingredient?.fraction} {ingredient?.unit}
                <br />
                {ingredient?.ingredient?.name}
              </li>
            ))}
          </ul>
          {recipe?.instructions && (
            <PortableText
              blocks={recipe?.instructions}
              className="instruction"
            />
          )}
        </div>
      </main>
    </article>
  );
}

export async function getStaticPaths() {
  const paths = await sanityClient.fetch(
    `*[_type == "recipe" && defined(slug.current)]{
            "params": {
                "slug": slug.current
            }
        }`
  );
  // console.log('paths', paths);
  return {
    paths,
    fallback: true,
  };
}
export async function getStaticProps({ params }) {
  const { slug } = params;
  const recipe = await sanityClient.fetch(recipeQuery, { slug });
  //   console.log(recipe);
  return { props: { data: { recipe }, preview: false } };
}
